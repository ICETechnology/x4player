<template>
	<transition name="fade">
		<div v-show="display" class="FULL helper-container" :style="{'z-index': zindex}">
			<div class="FULL helper-mask" @click="onClose"/>
			<div class="helper-ctn sys-bgc flex-col">
				<!-- 關閉圖示 -->
				<div class="flex-end mgr1d5 mgtb1"><i class="material-icons md-24" @click="onClose">close</i></div>
				<!-- 圖片與文字 -->
				<HelperContent class="flex-1 posr helper-content" v-if="display" :helperList="helperList" />
				<div class="flex-center mgb5">
					<Button class="btn-ok font-size-big" @click="onClose">{{$ln(`我知道了`)}}</Button>
				</div>
			</div>
		</div>
	</transition>
</template>

<script>
// 利用移除 HelperContent 來避免 Swiper 可能殘留導致異常的問題
import HelperContent from "@/components/HelperContent.vue"

export default {
	props: [],
	data() {
		return {
			helperKey: "",
			zindex: 5,
		}
	},
	beforeMount() {
		// 支持指定 zindex 未指定時預設 5
		eventBus.$on("HEPLER", (helperKey, zindex)=>{
			// 已經看過了直接 return
			if (this.$store.state.helper[helperKey] || isDesktop)
				return;
			this.helperKey = helperKey;
			this.zindex = zindex || 5;
		});
	},
    mounted() {},
	beforeDestroy() {},
	components: {HelperContent},
    methods: {
		onClose() {
			this.$set(this.$store.state.helper, this.helperKey, true);
			this.helperKey = "";
			eventBus.$emit("ONCLOSE-HELPER");
		}
	},
	watch: {},
    computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		helper() {
			return this.$store.state.config.quotePdSetting.helper;
		},
		/** 由 HELPER 事件取出的 Key 所對應的教學 */
		helperList() {
			return this.helper && this.helper[this.helperKey] ? this.helper[this.helperKey] : [];
		},
		/** 有對應的教學才跳出來顯示 */
		display() {
			return this.helperList && this.helperList.length > 0;
		}
	},
}
</script>

<style scoped>
.helper-container {
	/* z-index: 5; */
}
.helper-mask {
	background-color: rgba(0, 0, 0, 0.5);
}
.helper-ctn {
	position: absolute;
	top: 10vw;
	left: 5vw;
	right: 5vw;
	bottom: 10vw;
	border-radius: 2vw;
	background-color: white;
	opacity: 1;
	color: black;
	transition-duration: .3s;
}
.fade-enter, .fade-leave-to {
	opacity: 0;
}
.btn-ok {
	font-weight: bold;
	color: black !important;
	border-radius: 7vw;
	padding: 1.5vw 10vw;
	margin-bottom: 5vw;
	background-color: white !important;
	border: 2px solid black !important;
}

@media screen and (max-height: 620px) {
	.helper-ctn {
		top: 5vw;
		left: 15vw;
		bottom: 5vw;
		width: 70vw;
	}
	.btn-ok {
		margin-bottom: 1vw;
	}
}
</style>