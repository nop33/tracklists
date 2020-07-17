<template>
  <v-snackbar v-model="showSnackBar">
    {{ text }}
    <template v-slot:action="{ attrs }">
      <v-btn text v-bind="attrs" @click="showSnackBar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['text'],
  computed: {
    ...mapState(['isSnackBarVisible']),
    showSnackBar: {
      get () {
        return this.isSnackBarVisible
      },
      set (value) {
        this.$store.dispatch('toggleSnackBar', value)
      }
    }
  }
}
</script>
