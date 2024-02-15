<template>
  <div class="selectGroupWrapper">
    <header class="flex-item pT10 selHeader">
      <i class="material-icons pL5" >{{propsData.title.icon}}</i>
      <span class="pL5">{{propsData.title.name}}</span>
    </header>
    <div v-for="(gp,key) in propsData.group" :key="key" class="gpWrapper">
      <div class="bottomline pT10 pL10">{{gp.title}}</div>
      <div
        v-for="(item,itemkey) in gp.list"
        :key="itemkey"
        class="flex-item bottomline flexBetween gpList"
      >
        <span class="pT5">{{item.title}}</span>
        <div class="flex-item radioWrapper">
          <div v-for="(ops, k) in item.options" :key="k" class="radioitem">
            <input
              type="radio"
              :id="itemkey+'-'+ops.value"
              :name="itemkey+'-'+itemkey"
              :checked="ops.value==item.atv"
            >
            <label :for="itemkey+'-'+ops.value" class="radiobtn p5">{{ops.name}}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {};
  },
  props: ["propsData"]
};
</script>
<style scoped>
.selectGroupWrapper {
  width: 100%;
}
.pT10 {
  padding: 10px 0;
}
.pL5 {
  padding: 0 5px;
}
.flexBetween {
  justify-content: space-between;
}

.selHeader {
  background-color: #333;
}
.pL10 {
  padding-left: 10px;
}
.gpList {
  padding: 5px 5px 5px 20px;
}
.flexBetween span,
.selHeader span,
.selHeader i,
.radiobtn {
  display: block;
}
.pT5 {
  padding: 5px 0;
}
input[type="radio"] {
  position: absolute;
  visibility: hidden;
  display: none;
}
.radioWrapper input[type="radio"]:checked + label {
  background-color: rgba(255, 152, 0, 0.932);
}
.radioitem + .radioitem {
  /* border-left: solid 2px rgba(255, 152, 0, 0.932); */
}
.radioWrapper {
  border: 1px solid rgba(255, 152, 0, 0.932);
  border-radius: 4px;
  text-align: center;
  overflow: hidden;
}
.bottomline {
  border-bottom: 1px solid #333;
}
.p5 {
  padding: 5px;
}
</style>
