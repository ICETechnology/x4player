<template>
  <div class="flex-item radio-item tcef">
    <input
      type="radio"
      :id="this.generateId()"
      :name="radioName||this.generateName()"
      :value="radioValue"
      :checked="isChecked || this.verifyChecked(radioValue)"
      @change="handleChange($event)"
    >
    <label :for="this.generateId()" class="flex-item radio-btn flex-1 flex-center">
      <slot>{{radioItem}}</slot>
    </label>
  </div>
</template>
<script>
export default {
  data() {
    return {};
  },
  props: ["radioValue", "radioName", "radioItem", "isChecked"],

  methods: {
    handleChange(e) {
      this.$parent.$emit("change", {
        value: e.target.value,
        text: this.getText()
      });
    },
    getText() {
      return this.$el.querySelector("label").textContent;
    },
    verifyChecked(val){
      return this.$parent._data.default==val;
    },
    generateId() {
      return this.radioValue + this.$parent._uid;
    },
    generateName() {
      return "radio" + this.$parent._uid;
    }
  }
};
</script>
<style scoped>
.radio-item {
}
.radio-btn {
  padding: 5px 10px;
  align-items: center;
}
input[type="radio"] {
  position: absolute;
  visibility: hidden;
  display: none;
}
input[type="radio"]:checked + label {
  background-color: rgba(255, 152, 0, 0.932);
}
.radio-item + .radio-item {
  /* border-left: solid 2px rgba(255, 152, 0, 0.932); */
}
</style>
