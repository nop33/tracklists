<template>
  <v-list-item @click="onClickMethod(id)">
    <v-list-item-avatar>
      <v-img v-if="imageUrl" :src="imageUrl"></v-img>
      <v-icon v-else :color="color">{{ icon }}</v-icon>
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title v-text="name"></v-list-item-title>
    </v-list-item-content>
    <v-list-item-icon>
      <v-chip>{{ tracksTotal }}</v-chip>
    </v-list-item-icon>
  </v-list-item>
</template>

<script>
export default {
  props: [
    'id',
    'imageUrl',
    'name',
    'tracksTotal',
    'icon',
    'color',
    'onClickMethod'
  ]
}
</script>
