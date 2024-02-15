<template>
    <div class="flex-column">
		<div class="head flex-start">
			<BtnBack></BtnBack>
			<span class="icon-btn"><i class="material-icons">cloud_queue</i></span>
			<span class="ml5">云端条件单</span>
		</div>
		<div class="body flex-1 flex-column">
			<TabGroup :tabList="tabList"></TabGroup>
		</div>
		<div class="foot flex-center flex-column">
			<div>新增云端条件单</div>
		</div>
    </div>
</template>

<script>
import BtnBack from "@/components/BtnBack.vue";
import TabGroup from "@/components/Framework/TabGroup.vue";

export default {
	data() {
		return {
			tabList: [
				{label: "未触发", comClass: "CloudDetail", param: {mode: 1}},
				{label: "已触发", comClass: "CloudDetail", param: {mode: 2}},
			],
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {
		BtnBack,
		TabGroup,
	},
    methods:{
	},
	watch: {
	},
    computed: {
    }
}
</script>

<style scoped>
.head {
	padding: 0 10px;
	background-color: #333;
}
.foot {
	height: 50px;
	background-color: #000;
}
</style>