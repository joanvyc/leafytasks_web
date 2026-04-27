<template>
  <div class="min-h-screen bg-[#F0E4D0]">
    <UDashboardNavbar class="bg-[#FFEFEE]">
      <template #title>
        <ULink class="font-bold" to="/dashboard">LeafyTasks</ULink>
      </template>
      <template #right>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <ULink class="mr-5" to="/dashboard">Dashboard</ULink>
          <UserButton class="mr-3" />
        </Show>
      </template>
    </UDashboardNavBar>

    <!-- B3D392 -->
    <!-- 53F567 -->
    <main class="p-6">
      <UContainer class="max-w-250 h-screen h-[98%]">
        <slot/>
      </UContainer>
    </main>
  </div>
</template>
