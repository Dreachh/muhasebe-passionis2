"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

interface BorcEkleParams {
  tedarikciId: string
  amount: number
  currency: string
  description: string
  date: string
}

export async function borcEkle(params: BorcEkleParams) {
  const { tedarikciId, amount, currency, description, date } = params

  try {
    // Borç ekleme işlemi
    await db.borc.create({
      data: {
        tedarikciId,
        amount,
        currency,
        description,
        date: new Date(date),
        status: "ACTIVE",
      },
    })

    revalidatePath("/borclar")
    return { success: true }
  } catch (error) {
    console.error("Borç oluşturma hatası:", error)
    throw new Error("Borç oluşturulamadı")
  }
}

export async function borcSil(formData: FormData) {
  const borcId = formData.get("borcId") as string

  if (!borcId) {
    throw new Error("Borç ID'si gereklidir")
  }

  try {
    // Borcu sil
    await db.borc.delete({
      where: {
        id: borcId,
      },
    })

    // İlişkili ödemeleri sil
    await db.odeme.deleteMany({
      where: {
        borcId,
      },
    })

    revalidatePath("/borclar")
    return { success: true }
  } catch (error) {
    console.error("Borç silme hatası:", error)
    throw new Error("Borç silinemedi")
  }
}
