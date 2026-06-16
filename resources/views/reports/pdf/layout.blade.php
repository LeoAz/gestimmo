<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 10px;
        }
        .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0;
            color: #666;
        }
        .filters {
            margin-bottom: 20px;
            background: #F3F4F6;
            padding: 10px;
            border-radius: 5px;
        }
        .filters span {
            font-weight: bold;
            margin-right: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #4F46E5;
            color: white;
            text-align: left;
            padding: 10px;
            border: 1px solid #ddd;
        }
        td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: #999;
            padding: 10px 0;
            border-top: 1px solid #eee;
        }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .status-badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            text-transform: uppercase;
        }
        .status-available { background: #D1FAE5; color: #065F46; }
        .status-occupied { background: #FEE2E2; color: #991B1B; }
    </style>
</head>
<body>
    <div class="header">
        @if(isset($organization) && $organization->logo)
            <img src="{{ public_path('storage/' . $organization->logo) }}" style="height: 60px; margin-bottom: 10px;">
        @endif
        <h1>{{ $organization->name ?? 'IMO-APP' }}</h1>
        <p>{{ $title }}</p>
        <p style="font-size: 10px;">
            @if(isset($organization))
                {{ $organization->address }} {{ $organization->city }} {{ $organization->country }}<br>
                Tél: {{ $organization->phone }} | Email: {{ $organization->email }}
                @if($organization->tax_number) | IFU: {{ $organization->tax_number }} @endif
            @else
                Généré le {{ now()->format('d/m/Y H:i') }}
            @endif
        </p>
    </div>

    @if(!empty($filters))
    <div class="filters">
        <span>Filtres :</span>
        @if(isset($filters['start_date'])) Du: {{ $filters['start_date'] }} @endif
        @if(isset($filters['end_date'])) Au: {{ $filters['end_date'] }} @endif
        @if(isset($filters['property_id'])) Bien: #{{ $filters['property_id'] }} @endif
    </div>
    @endif

    @yield('content')

    <div class="footer">
        © {{ date('Y') }} {{ $organization->name ?? 'IMO-APP' }} - Rapport professionnel de gestion immobilière
    </div>
</body>
</html>
