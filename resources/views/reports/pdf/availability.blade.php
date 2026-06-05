@extends('reports.pdf.layout')

@section('content')
<table style="border-top: 4px solid #F59E0B;">
    <thead style="background-color: #F59E0B;">
        <tr>
            <th>Bien Immobilier</th>
            <th>Type</th>
            <th>Ville</th>
            <th>Statut</th>
            <th class="text-right">Prix</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $row)
        <tr>
            <td>{{ $row->title }}</td>
            <td>{{ $row->type }}</td>
            <td>{{ $row->city }}</td>
            <td>
                <span class="status-badge {{ $row->status === 'available' ? 'status-available' : 'status-occupied' }}">
                    {{ $row->status === 'available' ? 'Disponible' : 'Occupé' }}
                </span>
            </td>
            <td class="text-right">{{ number_format($row->price, 0, ',', ' ') }} FCFA</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div style="margin-top: 20px;">
    <p><strong>Résumé :</strong></p>
    <ul>
        <li>Nombre total de biens : {{ $data->count() }}</li>
        <li>Biens disponibles : {{ $data->where('status', 'available')->count() }}</li>
        <li>Biens occupés : {{ $data->where('status', '!=', 'available')->count() }}</li>
        <li>Taux d'occupation : {{ $data->count() > 0 ? round(($data->where('status', '!=', 'available')->count() / $data->count()) * 100, 2) : 0 }}%</li>
    </ul>
</div>
@endsection
