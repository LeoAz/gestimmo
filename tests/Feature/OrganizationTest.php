<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Storage::fake('public');
    }

    public function test_organization_index_page_is_displayed(): void
    {
        $this->actingAs($this->user)
            ->get(route('organizations.index'))
            ->assertOk();
    }

    public function test_organization_create_page_is_displayed(): void
    {
        $this->actingAs($this->user)
            ->get(route('organizations.create'))
            ->assertOk();
    }

    public function test_organization_can_be_created(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');

        $data = [
            'name' => 'Nouvelle Organisation',
            'email' => 'contact@neworg.com',
            'logo' => $file,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('organizations.store'), $data);

        $response->assertRedirect(route('organizations.index'));
        $this->assertDatabaseHas('organizations', ['name' => 'Nouvelle Organisation']);

        $organization = Organization::where('name', 'Nouvelle Organisation')->first();
        Storage::disk('public')->assertExists($organization->logo);
    }

    public function test_organization_edit_page_is_displayed(): void
    {
        $organization = Organization::create(['name' => 'Existing Org']);

        $this->actingAs($this->user)
            ->get(route('organizations.edit', $organization))
            ->assertOk();
    }

    public function test_organization_can_be_updated(): void
    {
        $organization = Organization::create(['name' => 'Old Name']);

        $response = $this->actingAs($this->user)
            ->patch(route('organizations.update', $organization), [
                'name' => 'New Name',
            ]);

        $response->assertRedirect(route('organizations.index'));
        $this->assertDatabaseHas('organizations', ['id' => $organization->id, 'name' => 'New Name']);
    }

    public function test_organization_can_be_deleted(): void
    {
        $organization = Organization::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->user)
            ->delete(route('organizations.destroy', $organization));

        $response->assertRedirect(route('organizations.index'));
        $this->assertDatabaseMissing('organizations', ['id' => $organization->id]);
    }
}
