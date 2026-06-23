import { format } from "date-fns"
import * as React from "react"

export interface InvoiceItem {
    id?: number
    designation: string
    period: string | null
    months_count?: number
    unit_price?: string | number
    quantity?: string | number
    total: string | number
}

export interface Invoice {
    id: number
    invoice_number: string
    date: string
    due_date: string | null
    type: string
    amount_ht: string | number
    tax_amount: string | number
    total_amount: string | number
    status: string
    notes: string | null
    rental: {
        property: {
            title: string
            parent?: {
                title: string
            }
        }
        tenant: {
            first_name: string
            last_name: string
            phone: string
            address: string | null
        }
    }
    items?: InvoiceItem[]
    invoice?: {
        items?: InvoiceItem[]
    }
}

interface Props {
    invoice: Invoice
}

export function InvoiceView({ invoice }: Props) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(amount))
    }

    const numberToWords = (num: number) => {
        const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
        const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"]
        const scales = ["", "mille", "million", "milliard"]

        if (num === 0) {
            return "zéro"
        }

        const convertChunk = (n: number): string => {
            let chunk = ""

            if (n >= 100) {
                const hundreds = Math.floor(n / 100)
                chunk += (hundreds > 1 ? units[hundreds] + " " : "") + "cent "
                n %= 100
            }

            if (n >= 20) {
                const t = Math.floor(n / 10)
                const u = n % 10

                if (t === 7 || t === 9) {
                    chunk += tens[t - 1] + "-" + (u === 1 ? "et-" : "") + (u === 0 ? "dix" : units[u + 10] || "dix-" + units[u])
                } else {
                    chunk += tens[t] + (u === 1 ? "-et-" : u > 0 ? "-" : "") + units[u]
                }
            } else if (n >= 10) {
                const special = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
                chunk += special[n - 10]
            } else if (n > 0) {
                chunk += units[n]
            }

            return chunk.trim()
        }

        let word = ""
        let scaleIndex = 0
        let tempNum = num

        while (tempNum > 0) {
            const chunk = tempNum % 1000

            if (chunk > 0) {
                const chunkText = convertChunk(chunk)
                const scaleText = scales[scaleIndex]
                word = chunkText + (scaleText ? " " + scaleText : "") + (word ? " " + word : "")
            }

            tempNum = Math.floor(tempNum / 1000)
            scaleIndex++
        }

        const result = word.trim()

        return result.charAt(0).toUpperCase() + result.slice(1)
    }

    const items = invoice.items || invoice.invoice?.items || []

    return (
        <div className="bg-white p-8 mx-auto max-w-[210mm] text-sm text-gray-800 font-sans print:p-8 print:m-0 print:max-w-none print:text-[12px] break-inside-avoid">
            {/* Logo and Company Name */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 font-bold text-2xl">
                        <span className="p-1 border-2 border-gray-800 rounded">DP</span>
                        <span>DJIGUE <br/><span className="text-xs font-normal">PROPERTIES</span></span>
                    </div>
                </div>
            </div>

            {/* Invoice Header */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <span className="font-bold">FACTURE N°</span>
                    <span className="ml-4">{invoice.invoice_number}</span>
                </div>
                <div className="text-xl font-serif italic pr-20 flex flex-col items-end">
                    {invoice.rental.property.parent && (
                        <span className="text-xs font-sans not-italic text-gray-500 uppercase tracking-wider mb-1">
                            {invoice.rental.property.parent.title}
                        </span>
                    )}
                    <span>{invoice.rental.property.title}</span>
                </div>
            </div>

            {/* Date and Address Section */}
            <div className="grid grid-cols-2 gap-0 border border-gray-400 mb-6">
                <div className="p-2 border-r border-gray-400">
                    <span className="font-bold">Date : </span>
                    <span>{format(new Date(invoice.date), "dd/MM/yyyy")}</span>
                </div>
                <div className="p-2">
                    <div className="font-bold mb-2 underline">Adressé</div>
                    <div className="space-y-1">
                        <div><span className="font-bold">Client : </span>{invoice.rental.tenant.first_name} {invoice.rental.tenant.last_name}</div>
                        <div><span className="font-bold">Adresse : </span>{invoice.rental.tenant.address || "N/A"} - TEL : {invoice.rental.tenant.phone}</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-gray-400 mb-0">
                <thead>
                    <tr className="border-b border-gray-400 bg-gray-50">
                        <th className="border-r border-gray-400 p-2 text-left font-bold uppercase text-[10px]">Appartement / Bien</th>
                        <th className="border-r border-gray-400 p-2 text-left font-bold uppercase text-[10px]">Désignation</th>
                        <th className="border-r border-gray-400 p-2 text-left font-bold uppercase text-[10px]">Période</th>
                        <th className="border-r border-gray-400 p-2 text-left font-bold uppercase text-[10px]">Mois</th>
                        <th className="p-2 text-left font-bold uppercase text-[10px]">Montant</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="h-16 print:h-12 align-top">
                            <td className="border-r border-gray-400 p-2">
                                {index === 0 ? (
                                    <div className="flex flex-col">
                                        {invoice.rental.property.parent && (
                                            <span className="text-[10px] text-gray-500 uppercase">
                                                {invoice.rental.property.parent.title}
                                            </span>
                                        )}
                                        <span className="font-medium">{invoice.rental.property.title}</span>
                                    </div>
                                ) : ""}
                            </td>
                            <td className="border-r border-gray-400 p-2">{item.designation}</td>
                            <td className="border-r border-gray-400 p-2">{item.period}</td>
                            <td className="border-r border-gray-400 p-2 text-center">{item.months_count || 1}</td>
                            <td className="p-2 font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                    ))}
                    {/* Empty space filler if needed */}
                    <tr className="h-24 print:h-16">
                        <td className="border-r border-gray-400"></td>
                        <td className="border-r border-gray-400"></td>
                        <td className="border-r border-gray-400"></td>
                        <td className="border-r border-gray-400"></td>
                        <td></td>
                    </tr>
                    <tr className="border-t border-gray-400 bg-gray-50">
                        <td colSpan={4} className="border-r border-gray-400 p-2 text-right font-bold uppercase">TOTAL HT</td>
                        <td className="p-2 font-bold">{formatCurrency(invoice.total_amount)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-4 mb-12">
                <p>Arrêtée la présente facture à la somme de : <span className="font-serif italic font-medium">{numberToWords(Number(invoice.total_amount))} Francs CFA HT</span></p>
            </div>

            {/* Footer with Signatures and Bank Details */}
            <div className="grid grid-cols-2 gap-8 mt-8 mb-12 print:mt-4 print:mb-6">
                <div className="text-center">
                    <div className="font-bold mb-16 underline uppercase">Pour Acquit</div>
                </div>
                <div className="text-center">
                    <div className="font-bold mb-16 underline uppercase">LE GERANT</div>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 print:mt-4">
                <div className="text-[10px] grid grid-cols-2 gap-8">
                    <div>
                        <div className="font-bold underline mb-1">Informations bancaires :</div>
                        <div className="grid grid-cols-[100px_1fr] gap-x-2">
                            <span className="font-bold">BANK :</span> <span>CORIS BANK</span>
                            <span className="font-bold">TITULAIRE DU COMPTE :</span> <span>DJIGUE PROPERTIES SARLU</span>
                            <span className="font-bold">Code Banque :</span> <span>ML181</span>
                            <span className="font-bold">Agence :</span> <span>01007</span>
                            <span className="font-bold">Compte :</span> <span>003221124101</span>
                            <span className="font-bold">Clé Rib :</span> <span>10</span>
                            <span className="font-bold">Code IBAN :</span> <span>ML18 1010 0700 3221 1241 0110</span>
                            <span className="font-bold">Code SWIFT :</span> <span>CORIMLBA</span>
                        </div>
                    </div>
                    <div className="flex flex-col justify-end text-center italic text-gray-500">
                        {/* Mention supprimée à la demande de l'utilisateur */}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-500 print:mt-4 print:pt-2">
                <div>DJIGUE PROPERTIES Sarlu</div>
                <div>Daoudabougou, Face Hôtel des Colibris, Bamako - Mali / +223 66 75 84 42 / 90 86 86 86 ousmane@djigueproperties.com</div>
                <div>RCCM N° MA.BKO.2023.B.4040 - NIF : 084151646T</div>
            </div>
        </div>
    )
}
