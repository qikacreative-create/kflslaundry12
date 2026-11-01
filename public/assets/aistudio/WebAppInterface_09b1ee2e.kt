package com.kafilasuci4.app

import android.content.Context
import android.webkit.JavascriptInterface

/**
 * Jembatan komunikasi JavaScript Web ke Kotlin Android (Interface: "MesinPrint")
 */
class WebPrintInterface(
    private val context: Context,
    private val strukHelper: StrukHelper
) {
    /**
     * METODE 1: Cetak Teks Struk Langsung (Rekomendasi Utama)
     * Format teks sudah disusun rapi oleh Web (32 karakter per baris),
     * sehingga 100% PERSIS sama dengan preview di layar aplikasi.
     */
    @JavascriptInterface
    fun cetakTeksStruk(teksStruk: String) {
        strukHelper.cetakTeksStrukLangsung(teksStruk)
    }

    /**
     * METODE 2: Cetak Bluetooth Berparameter (22 Parameter)
     * Kompatibel dengan pemanggilan fungsi lama, dengan layout yang sudah disesuaikan
     * persis sama dengan preview nota laundry.
     */
    @JavascriptInterface
    fun prosesCetakBluetooth(
        namaAcara: String,
        namaKlien: String,
        paketDipilih: String,
        hargaPaketDasar: Long,
        namaTambahan: String,
        hargaTambahan: Long,
        lokasi: String,
        tanggalBayar: String,
        waktuEvent: Long,
        totalTarif: Long,
        nominalDibayar: Long,
        nominalDiskon: Long,
        dpDibayar: Long,
        isLunas: Boolean,
        noStruk: String,
        catatan: String,
        metodeBayar: String,
        isArsip: Boolean,
        namaBrand: String = "Kafela's Laundry",
        namaAdmin: String = "Kasir",
        logoBase64: String = "",
        ttdBase64: String = ""
    ) {
        strukHelper.cetakStrukBluetoothFisik(
            namaAcara = namaAcara,
            namaKlien = namaKlien,
            paketDipilih = paketDipilih,
            hargaPaketDasar = hargaPaketDasar,
            namaTambahan = namaTambahan,
            hargaTambahan = hargaTambahan,
            lokasi = lokasi,
            tanggalBayar = tanggalBayar,
            waktuEvent = waktuEvent,
            totalTarif = totalTarif,
            nominalDibayar = nominalDibayar,
            nominalDiskon = nominalDiskon,
            dpDibayar = dpDibayar,
            isLunas = isLunas,
            noStruk = noStruk,
            catatan = catatan,
            metodeBayar = metodeBayar,
            isArsip = isArsip,
            namaBrand = namaBrand,
            namaAdmin = namaAdmin,
            logoBase64 = logoBase64,
            ttdBase64 = ttdBase64
        )
    }

    /**
     * Alias jika web memanggil cetakStrukDariWeb
     */
    @JavascriptInterface
    fun cetakStrukDariWeb(
        namaAcara: String, namaKlien: String, paketDipilih: String, hargaPaketDasar: Long,
        namaTambahan: String, hargaTambahan: Long, lokasi: String, tanggalBayar: String,
        waktuEvent: Long, totalTarif: Long, nominalDibayar: Long, nominalDiskon: Long,
        dpDibayar: Long, isLunas: Boolean, noStruk: String, catatan: String,
        metodeBayar: String, isArsip: Boolean
    ) {
        prosesCetakBluetooth(
            namaAcara, namaKlien, paketDipilih, hargaPaketDasar, namaTambahan, hargaTambahan,
            lokasi, tanggalBayar, waktuEvent, totalTarif, nominalDibayar, nominalDiskon,
            dpDibayar, isLunas, noStruk, catatan, metodeBayar, isArsip
        )
    }
}
