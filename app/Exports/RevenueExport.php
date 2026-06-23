<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RevenueExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected $data) {}

    public function collection()
    {
        return $this->data;
    }

    public function title(): string
    {
        return 'Chiffre d\'Affaires';
    }

    public function headings(): array
    {
        return [
            'Immeuble',
            'Bien Immobilier',
            'Locataire',
            'Date de paiement',
            'Période de facturation',
            'N° Facture',
            'Montant',
        ];
    }

    public function map($row): array
    {
        $period = $row->billing_period ?? (
            (isset($row->period_start) && isset($row->period_end))
                ? (Carbon::parse($row->period_start)->format('d/m/Y').' - '.Carbon::parse($row->period_end)->format('d/m/Y'))
                : ''
        );

        return [
            $row->building_title ?? '-',
            $row->property_title,
            $row->tenant_name,
            Carbon::parse($row->payment_date)->format('d/m/Y'),
            $period,
            $row->invoice_number,
            $row->amount.' FCFA',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '10B981'],
                ],
            ],
        ];
    }
}
