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

// Müşteri borcu arayüzü
export interface CustomerDebt {
  id: string;
  customerId: string;
  customerName: string;
  tourId?: string;
  amount: number;
  currency: string;
  description: string;
  dueDate?: Date;
  status: 'unpaid' | 'partially_paid' | 'paid';
  paidAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  sourceType: 'expense' | 'activity'; // Borcun kaynağı (gider veya aktivite)
  sourceId: string; // Gider veya aktivite ID'si
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
export const addDebt = async (debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'paidAmount'>) => {
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
export const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
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

// Müşteri borçlarını getir
export const getCustomerDebts = async () => {
  try {
    const db = getDb();
    const debtsRef = collection(db, COLLECTIONS.CUSTOMER_DEBTS);
    const snapshot = await getDocs(debtsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error("Müşteri borçları getirilirken hata:", error);
    return [];
  }
};

// Müşteri borcu ekle
export const addCustomerDebt = async (debtData: Omit<CustomerDebt, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'paidAmount'>) => {
  try {
    const db = getDb();
    const now = new Date();
    const debtWithDates = {
      ...debtData,
      createdAt: now,
      updatedAt: now,
      status: 'unpaid' as const,
      paidAmount: 0,
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMER_DEBTS), debtWithDates);
    return { id: docRef.id, ...debtWithDates };
  } catch (error) {
    console.error("Müşteri borcu eklenirken hata:", error);
    throw error;
  }
};

// Tur verisi arayüzü - Tour verisi için kısmi bir tanımlama
interface TourData {
  id: string;
  customerName: string;
  numberOfPeople?: string | number;
  expenses?: Array<{
    id: string;
    name: string;
    type?: string;
    amount: string | number;
    currency: string;
    details?: string;
    addToDebt?: boolean;
  }>;
  activities?: Array<{
    id: string;
    name: string;
    price: string | number;
    currency: string;
    participants?: string | number;
    participantsType?: string;
    details?: string;
    addToDebt?: boolean;
  }>;
}

// Tur aktivitelerinden ve giderlerinden müşteri borçlarını oluştur
export const createCustomerDebtsFromTour = async (tourData: TourData) => {
  try {
    const results = [];
    
    // Müşteri bilgilerini hazırla
    const customerId = tourData.id; // Tur ID'sini müşteri ID olarak kullanabiliriz veya gerçek müşteri ID'si varsa onu kullanmalıyız
    const customerName = tourData.customerName;
    const tourId = tourData.id;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Varsayılan olarak 30 gün sonra
    
    // Borç olarak işaretlenmiş giderleri ekle
    if (tourData.expenses && tourData.expenses.length > 0) {
      for (const expense of tourData.expenses) {
        if (expense.addToDebt) {
          const debtData = {
            customerId,
            customerName,
            tourId,
            amount: parseFloat(expense.amount as string),
            currency: expense.currency,
            description: `${expense.name} (${expense.type || 'Gider'})`,
            dueDate,
            sourceType: 'expense' as const,
            sourceId: expense.id,
            notes: expense.details || '',
          };
          
          const result = await addCustomerDebt(debtData);
          results.push(result);
        }
      }
    }
    
    // Borç olarak işaretlenmiş aktiviteleri ekle
    if (tourData.activities && tourData.activities.length > 0) {
      for (const activity of tourData.activities) {
        if (activity.addToDebt) {
          let participants = 1;
          if (activity.participantsType === 'all') {
            participants = parseInt(tourData.numberOfPeople as string || '1');
          } else if (activity.participants) {
            participants = parseInt(activity.participants as string);
          }
          
          const totalAmount = parseFloat(activity.price as string) * participants;
          
          const debtData = {
            customerId,
            customerName,
            tourId,
            amount: totalAmount,
            currency: activity.currency,
            description: `${activity.name} Aktivitesi`,
            dueDate,
            sourceType: 'activity' as const,
            sourceId: activity.id,
            notes: activity.details || '',
          };
          
          const result = await addCustomerDebt(debtData);
          results.push(result);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Tur verilerinden müşteri borçları oluşturulurken hata:", error);
    throw error;
  }
};
