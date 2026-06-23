<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AvailabilityExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected $data) {}

    public function collection()
    {
        return $this->data;
    }

    public function title(): string
    {
        return 'Disponibilité des Biens';
    }

    public function headings(): array
    {
        return [
            'Immeuble',
            'Bien Immobilier',
            'Type',
            'Ville',
            'Statut',
            'Prix',
        ];
    }

    public function map($row): array
    {
        return [
            $row->building_title ?? '-',
            $row->title,
            $row->type,
            $row->city,
            $row->status === 'available' ? 'Disponible' : 'Occupé',
            $row->price.' FCFA',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F59E0B'],
                ],
            ],
        ];
    }
}
