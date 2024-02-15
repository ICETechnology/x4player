<template>
    <div class="ad-btn pdtb2 flex-row" v-if="buttonList && buttonList.length > 0">
		<div v-for="obj in buttonList" class="flex-1 ad-btn-ctn flex-center font-size-xl font-bold">
			<div class="ad-button bgc-white clr-black flex-center" @click="onClick(obj)">
				<span v-if="obj.name">{{obj.name}}</span>
				<img v-if="obj.image" :src="obj.image" />
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick(obj) {
			window.openLink(obj.url);
		}
	},
	watch: {},
    computed: {
		buttonList() {
			try{return this.$store.state.config.quotePdSetting.function.homepage.link_button;}catch(e){}
			return [];
		},
	},
}
</script>

<style scoped>
.ad-btn-ctn {
	/* border: 1px dashed #333; */
}
.ad-btn-ctn .ad-button {
	width: 90%;
	height: 2em;
	border: 1px solid #AAA;
	cursor: pointer;
	border-radius: 0.3em;
}
.ad-btn-ctn .ad-button:hover {
	border: 1px solid aqua;
	box-sizing: border-box;
}
.ad-btn-ctn .ad-button img {
	width: 100%;
	height: 100%;
	border-radius: 0.3em;
}
</style>