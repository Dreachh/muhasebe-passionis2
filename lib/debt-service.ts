import { getDb } from "@/lib/firebase-client-module";
import { COLLECTIONS } from "@/lib/db-firebase";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

// Borç tipleri
export interface Debt {
  id: string;
  companyId: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: Date;
  status: 'unpaid' | 'partially_paid' | 'paid';
  paidAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  companyId: string;
  debtId?: string;
  amount: number;
  currency: string;
  description: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  type?: string;
}

// Borçları getir
export const getDebts = async () => {
  try {
    const db = getDb();
    const debtsRef = collection(db, COLLECTIONS.DEBTS);
    const snapshot = await getDocs(debtsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error("Borçlar getirilirken hata:", error);
    return [];
  }
};

// Ödemeleri getir
export const getPayments = async () => {
  try {
    const db = getDb();
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    const snapshot = await getDocs(paymentsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      paymentDate: doc.data().paymentDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error("Ödemeler getirilirken hata:", error);
    return [];
  }
};

// Tedarikçileri getir
export const getSuppliers = async () => {
  try {
    const db = getDb();
    const companiesRef = collection(db, COLLECTIONS.COMPANIES);
    const q = query(companiesRef, where("type", "==", "supplier"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Tedarikçiler getirilirken hata:", error);
    return [];
  }
};

// Borç ekle
export const addDebt = async (debtData) => {
  try {
    const db = getDb();
    const now = new Date();
    const debtWithDates = {
      ...debtData,
      createdAt: now,
      updatedAt: now,
      status: 'unpaid',
      paidAmount: 0,
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.DEBTS), debtWithDates);
    return { id: docRef.id, ...debtWithDates };
  } catch (error) {
    console.error("Borç eklenirken hata:", error);
    throw error;
  }
};

// Ödeme ekle
export const addPayment = async (paymentData) => {
  try {
    const db = getDb();
    const now = new Date();
    const paymentWithDates = {
      ...paymentData,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), paymentWithDates);
    
    // Eğer ödeme bir borca bağlıysa borç durumunu güncelle
    if (paymentData.debtId) {
      const debtRef = doc(db, COLLECTIONS.DEBTS, paymentData.debtId);
      const debtDoc = await getDoc(debtRef);
      
      if (debtDoc.exists()) {
        const debtData = debtDoc.data();
        const currentPaidAmount = debtData.paidAmount || 0;
        const newPaidAmount = currentPaidAmount + paymentData.amount;
        const totalAmount = debtData.amount;
        
        let newStatus = 'unpaid';
        if (newPaidAmount >= totalAmount) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partially_paid';
        }
        
        await updateDoc(debtRef, {
          paidAmount: newPaidAmount,
          status: newStatus,
          updatedAt: now,
        });
      }
    }
    
    return { id: docRef.id, ...paymentWithDates };
  } catch (error) {
    console.error("Ödeme eklenirken hata:", error);
    throw error;
  }
};
