<template>
  <v-btn x-large class="pa-10">
    <v-icon left :color="color">{{ icon }}</v-icon>
    {{ text}}
  </v-btn>
</template>

<script>
export default {
  props: [
    'icon',
    'text',
    'color'
  ]
}
</script>
