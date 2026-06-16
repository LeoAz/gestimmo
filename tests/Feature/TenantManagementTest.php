<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_list_tenants()
    {
        Tenant::factory()->count(3)->create();

        $response = $this->actingAs($this->user)->get(route('tenants.index'));

        $response->assertStatus(200);
    }

    public function test_can_create_tenant()
    {
        Storage::fake('public');

        $data = [
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
            'phone' => '0102030405',
            'address' => '123 Rue de la Paix',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'id_card' => UploadedFile::fake()->create('id_card.pdf', 100),
        ];

        $response = $this->actingAs($this->user)->post(route('tenants.store'), $data);

        $response->assertRedirect(route('tenants.index'));
        $this->assertDatabaseHas('tenants', [
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
        ]);

        $tenant = Tenant::where('first_name', 'Jean')->first();
        Storage::disk('public')->assertExists($tenant->photo);
        Storage::disk('public')->assertExists($tenant->id_card);
    }

    public function test_can_update_tenant()
    {
        $tenant = Tenant::factory()->create();

        $data = [
            'first_name' => 'Marc',
            'last_name' => 'Durand',
            'phone' => '0606060606',
            'address' => '456 Avenue des Champs',
        ];

        $response = $this->actingAs($this->user)->put(route('tenants.update', $tenant), $data);

        $response->assertRedirect(route('tenants.index'));
        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'first_name' => 'Marc',
            'last_name' => 'Durand',
        ]);
    }

    public function test_cannot_delete_tenant_with_active_rental()
    {
        $tenant = Tenant::factory()->create();
        Rental::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->delete(route('tenants.destroy', $tenant));

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('tenants', ['id' => $tenant->id]);
    }

    public function test_can_delete_tenant_without_active_rental()
    {
        Storage::fake('public');
        $photoPath = 'tenants/photos/photo.jpg';
        Storage::disk('public')->put($photoPath, 'dummy');

        $tenant = Tenant::factory()->create([
            'photo' => $photoPath,
        ]);

        // Une location terminée est OK
        Rental::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'terminated',
        ]);

        $response = $this->actingAs($this->user)->delete(route('tenants.destroy', $tenant));

        $response->assertRedirect(route('tenants.index'));
        $this->assertDatabaseMissing('tenants', ['id' => $tenant->id]);
        Storage::disk('public')->assertMissing($photoPath);
    }
}
