import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy,
  limit,
  writeBatch
} from "firebase/firestore";
import { db, MEMBERS_COLLECTION } from "../firebase";

/**
 * Fetch all members from Firestore
 */
export async function getAllMembers() {
  try {
    const membersRef = collection(db, MEMBERS_COLLECTION);
    const q = query(membersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const members = [];
    querySnapshot.forEach((docSnap) => {
      members.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    // Sort members in alphabetical order by name
    members.sort((a, b) => (a.name || '').trim().localeCompare((b.name || '').trim(), undefined, { sensitivity: 'base' }));
    return { success: true, data: members };
  } catch (error) {
    console.error("Error fetching members:", error);
    // Fallback query without orderBy in case indexing is pending
    try {
      const querySnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
      const members = [];
      querySnapshot.forEach((docSnap) => {
        members.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      // Sort members in alphabetical order by name
      members.sort((a, b) => (a.name || '').trim().localeCompare((b.name || '').trim(), undefined, { sensitivity: 'base' }));
      return { success: true, data: members };
    } catch (fallbackError) {
      console.error("Fallback error fetching members:", fallbackError);
      return { success: false, error: fallbackError.message, data: [] };
    }
  }
}

/**
 * Search member by 10-digit mobile number (fast indexed limit 1 query)
 */
export async function getMemberByPhone(phoneNumber) {
  try {
    const cleanPhone = String(phoneNumber).trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return { success: false, error: "Invalid 10-digit phone number." };
    }

    const membersRef = collection(db, MEMBERS_COLLECTION);
    const q = query(membersRef, where("phone", "==", cleanPhone), limit(1));
    const querySnapshot = await getDocs(q);


    if (querySnapshot.empty) {
      return { success: false, notFound: true, message: "This mobile number is not registered." };
    }

    const docSnap = querySnapshot.docs[0];
    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    };
  } catch (error) {
    console.error("Error finding member by phone:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a single member (with phone uniqueness check)
 */
export async function addSingleMember(memberData) {
  try {
    const cleanPhone = String(memberData.phone).trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new Error("Mobile number must be exactly 10 digits.");
    }

    // Check if phone already exists
    const existing = await getMemberByPhone(cleanPhone);
    if (existing.success && existing.data) {
      throw new Error(`A member with phone number ${cleanPhone} already exists.`);
    }

    const newMember = {
      name: memberData.name ? memberData.name.trim() : "",
      phone: cleanPhone,
      memberAddress: memberData.memberAddress ? memberData.memberAddress.trim() : "",
      businessAddress: memberData.businessAddress ? memberData.businessAddress.trim() : "",
      vertical: memberData.vertical || "",
      profilePhoto: memberData.profilePhoto || "",
      dob: memberData.dob || memberData.dateOfBirth || "",
      weddingDate: memberData.weddingDate || memberData.anniversaryDate || "",
      status: memberData.status || "Pending",
      isActive: memberData.isActive !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), newMember);
    return { success: true, id: docRef.id, member: { id: docRef.id, ...newMember } };
  } catch (error) {
    console.error("Error adding single member:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk upload members from parsed Excel data.
 * Skips duplicate phone numbers (both within the batch and existing in Firestore).
 */
export async function bulkUploadMembers(records, onProgress) {
  try {
    if (!records || records.length === 0) {
      return { success: false, error: "No records to upload." };
    }

    // Fetch existing phone numbers in Firestore to prevent duplicates
    const allMembersRes = await getAllMembers();
    const existingPhones = new Set(
      (allMembersRes.data || []).map(m => String(m.phone).trim().replace(/\D/g, '').slice(-10))
    );

    let uploadedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const seenBatchPhones = new Set();
    const validRecordsToUpload = [];

    // Filter and prepare records
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const cleanPhone = String(row.phone || "").trim().replace(/\D/g, '').slice(-10);
      const cleanName = String(row.name || "").trim();
      const cleanAddress = String(row.memberAddress || "").trim();
      const cleanDob = String(row.dob || row.dateOfBirth || "").trim();
      const cleanWeddingDate = String(row.weddingDate || row.anniversaryDate || "").trim();

      // If completely empty row, skip
      if (!cleanName && !cleanPhone && !cleanAddress) {
        skippedCount++;
        errors.push({ row: i + 1, name: "Empty Row", reason: "Blank row with no data" });
        continue;
      }

      // If phone is provided, check for duplicates
      if (cleanPhone) {
        if (cleanPhone.length !== 10) {
          console.warn(`Row ${i + 1}: Phone number ${row.phone} is not 10 digits, storing as is.`);
        }

        if (existingPhones.has(cleanPhone)) {
          skippedCount++;
          errors.push({ row: i + 1, name: cleanName || "Unknown", phone: cleanPhone, reason: "Phone number already registered in database" });
          continue;
        }

        if (seenBatchPhones.has(cleanPhone)) {
          skippedCount++;
          errors.push({ row: i + 1, name: cleanName || "Unknown", phone: cleanPhone, reason: "Duplicate phone number in Excel file" });
          continue;
        }

        seenBatchPhones.add(cleanPhone);
      }

      validRecordsToUpload.push({
        name: cleanName || "Member",
        phone: cleanPhone || "",
        memberAddress: cleanAddress,
        businessAddress: "",
        vertical: "",
        profilePhoto: "",
        dob: cleanDob,
        weddingDate: cleanWeddingDate,
        status: "Pending",
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }


    // Process in batches of 400 (Firestore batch limit is 500)
    const BATCH_SIZE = 400;
    const totalToUpload = validRecordsToUpload.length;

    for (let i = 0; i < totalToUpload; i += BATCH_SIZE) {
      const chunk = validRecordsToUpload.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      const membersRef = collection(db, MEMBERS_COLLECTION);

      chunk.forEach(item => {
        const newDocRef = doc(membersRef);
        batch.set(newDocRef, item);
      });

      await batch.commit();
      uploadedCount += chunk.length;

      if (onProgress) {
        onProgress(Math.round((uploadedCount / (totalToUpload || 1)) * 100));
      }
    }

    return {
      success: true,
      total: records.length,
      uploaded: uploadedCount,
      skipped: skippedCount,
      errors
    };
  } catch (error) {
    console.error("Error bulk uploading members:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Public Member Submission: Update profile with name, phone, memberAddress, business address, vertical, photo URL, dob, weddingDate, status = Completed
 */
export async function updateMemberProfile(memberId, profileData) {
  try {
    const memberDocRef = doc(db, MEMBERS_COLLECTION, memberId);
    const updatePayload = {
      name: profileData.name ? profileData.name.trim() : "",
      memberAddress: profileData.memberAddress ? profileData.memberAddress.trim() : "",
      businessAddress: profileData.businessAddress ? profileData.businessAddress.trim() : "",
      vertical: profileData.vertical || "",
      profilePhoto: profileData.profilePhoto || "",
      dob: profileData.dob || profileData.dateOfBirth || "",
      weddingDate: profileData.weddingDate || profileData.anniversaryDate || "",
      status: "Completed",
      updatedAt: serverTimestamp()
    };

    // If phone number is updated/provided
    if (profileData.phone) {
      const cleanPhone = String(profileData.phone).trim().replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        updatePayload.phone = cleanPhone;
      }
    }

    await updateDoc(memberDocRef, updatePayload);
    return { success: true };
  } catch (error) {
    console.error("Error updating member profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Admin Edit Member (all fields)
 */
export async function updateMemberAdmin(memberId, memberData) {
  try {
    const memberDocRef = doc(db, MEMBERS_COLLECTION, memberId);
    const updatePayload = {
      name: memberData.name ? memberData.name.trim() : "",
      phone: String(memberData.phone).trim().replace(/\D/g, '').slice(-10),
      memberAddress: memberData.memberAddress ? memberData.memberAddress.trim() : "",
      businessAddress: memberData.businessAddress ? memberData.businessAddress.trim() : "",
      vertical: memberData.vertical || "",
      profilePhoto: memberData.profilePhoto || "",
      dob: memberData.dob || memberData.dateOfBirth || "",
      weddingDate: memberData.weddingDate || memberData.anniversaryDate || "",
      status: memberData.status || "Pending",
      isActive: memberData.isActive !== false,
      updatedAt: serverTimestamp()
    };

    await updateDoc(memberDocRef, updatePayload);
    return { success: true };
  } catch (error) {
    console.error("Error updating member:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Enable or Disable a member (Active / Inactive)
 */
export async function setMemberActiveStatus(memberId, isActive) {
  try {
    const memberDocRef = doc(db, MEMBERS_COLLECTION, memberId);
    await updateDoc(memberDocRef, {
      isActive: Boolean(isActive),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating member active status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a member document
 */
export async function deleteMember(memberId) {
  try {
    const memberDocRef = doc(db, MEMBERS_COLLECTION, memberId);
    await deleteDoc(memberDocRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting member:", error);
    return { success: false, error: error.message };
  }
}
