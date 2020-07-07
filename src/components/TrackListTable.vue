<template>
  <v-data-table
      :headers="headers"
      :items="items"
      :items-per-page="5"
      class="elevation-1"
    >
  </v-data-table>
</template>

<script>
export default {
  props: ['items'],
  data: () => ({
    headers: [
      { text: 'Track name', value: 'name' },
      { text: 'Track artists', value: 'artists' }
    ]
  })
}
</script>
