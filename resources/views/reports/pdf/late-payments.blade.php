@extends('reports.pdf.layout')

@section('content')
<table>
    <thead>
        <tr>
            <th>N° Facture</th>
            <th>Bien Immobilier</th>
            <th>Locataire</th>
            <th>Date d'échéance</th>
            <th class="text-right">Jours de retard</th>
            <th class="text-right">Montant dû</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $row)
        <tr>
            <td>{{ $row->invoice_number }}</td>
            <td>{{ $row->property_title }}</td>
            <td>{{ $row->tenant_name }}</td>
            <td>{{ \Carbon\Carbon::parse($row->due_date)->format('d/m/Y') }}</td>
            <td class="text-right">{{ (int)$row->days_late }}</td>
            <td class="text-right">{{ number_format($row->amount_due, 0, ',', ' ') }} FCFA</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr>
            <td colspan="5" class="text-right font-bold">Total</td>
            <td class="text-right font-bold">{{ number_format($data->sum('amount_due'), 0, ',', ' ') }} FCFA</td>
        </tr>
    </tfoot>
</table>
@endsection
