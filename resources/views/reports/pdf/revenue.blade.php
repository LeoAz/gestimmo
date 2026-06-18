@extends('reports.pdf.layout')

@section('content')
<table style="border-top: 4px solid #10B981;">
    <thead style="background-color: #10B981;">
        <tr>
            <th>Bien Immobilier</th>
            <th>Locataire</th>
            <th>Date de paiement</th>
            <th>Période de facturation</th>
            <th>N° Facture</th>
            <th class="text-right">Montant</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $row)
        <tr>
            <td>{{ $row->property_title }}</td>
            <td>{{ $row->tenant_name }}</td>
            <td>{{ \Carbon\Carbon::parse($row->payment_date)->format('d/m/Y') }}</td>
            <td>{{ $row->billing_period ?? (\Carbon\Carbon::parse($row->period_start)->format('d/m/Y').' - '.\Carbon\Carbon::parse($row->period_end)->format('d/m/Y')) }}</td>
            <td>{{ $row->invoice_number }}</td>
            <td class="text-right">{{ number_format($row->amount, 0, ',', ' ') }} FCFA</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr>
            <td colspan="5" class="text-right font-bold">Total Chiffre d'Affaires</td>
            <td class="text-right font-bold">{{ number_format($data->sum('amount'), 0, ',', ' ') }} FCFA</td>
        </tr>
    </tfoot>
</table>
@endsection
