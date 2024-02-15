<template>
	<div class="flex-1" :class="{'flex-row row-reverse fight': model=='F', 'flex-col normal': model=='N', 'posr':!isDesktop}">
		<ThunderOptions :param="param" />
		<div class="flex-1 flex-col posr">
			<ThunderTable class="flex-1 flex-col" :suspend="suspend" :orgList="orgList" :reportList="reportList" 
            :allSellQty="allSellQty" :allBuyQty="allBuyQty" :param="param" :noMask="noMask"
			@createOrgListObj="createOrgListObj"
			/>
			<ThunderFoot :allSellQty="allSellQty" :allBuyQty="allBuyQty" :suspend="suspend" :reportList="reportList" :param="param"/>			
		</div>
		<!-- <LoadingIcon v-if="isLoading" transparent="true"></LoadingIcon> -->
		<Stamp v-if="(qos && !qop) || isExpire" stampStatus="EMPTY" />
		<transition name="lock" v-if="qop || !sid || isExpire">
			<div class="FULL lock-block flex-col" v-if="!noMask" @click.stop>
				<div class="flex-1 flex-col flex-center" @click="onMaskClick">
					<span class="icon icon-lock-all mb10"> </span>
					<span v-if="qo.$cd > 0">{{$ln('点击使用')}}</span>
				</div>
			</div>
		</transition>
		<div class="table-mask flex-top-right pd5 FULL" v-if="selectedPrice" v-stop-propagation-y>
			<i class="material-icons close-table-mask font-size-xl" @click="$store.state.thunder.selectedPrice=''">close</i>
		</div>
		<!-- <div v-if="isDesktop && fontSizeRatio > 7" class="FULL bgc-opt-gray zindex-2 flex-center">{{$ln(`本元件不支持当前宽度`)}}</div> -->
	</div>
</template>
<script>
import ThunderTable from "./ThunderTable.vue";
import ThunderOptions from "./ThunderOptions.vue";
import ThunderFoot from "./ThunderFoot.vue";
import ThunderDataCore from "./ThunderDataCore.vue";

export default {
	mixins: [ThunderDataCore],
	data() {
		return {
			isLoading: true,
			noMask: false,
		};
	},
	props: ["param", "suspend"],
	components: {ThunderTable, ThunderOptions, ThunderFoot},
	mounted() {
		// 新手教學
		eventBus.$emit("HEPLER", "thunder");
	},
	beforeDestroy() {
	},
	methods: {
		onMaskClick() {
			if(this.qo.$cd > 0 && this.sid)
				this.noMask = true;
			else 
				this.noMask = false;
		}
	},
	computed: {
        /** 用 qo.s 判斷是否有市況 (但是可能無最新價) */
        qos(){return this.qo.s;},
		model() {return this.param && this.param.model? this.param.model: this.$store.state.thunder.model},
		isDesktop() {return this.$store.state.device.isDesktop},
		fontSizeRatio() {
			return this.$store.state.desktop.selectedLayout.fontSizeRatio;
		},
		selectedPrice() {return this.$store.state.thunder.selectedPrice;},
		$cd() {return this.qo.$cd},
		isExpire() {return this.$cd == -22},
	},
	watch: {
        /** qos 改變表示有收到市況 */
        qos(){
            this.isLoading = false;
        },
		// 監看來自ThunderDataCore的qop
		qop(nv, ov){
			if(!ov && nv){
				// 關閉載入icon
				this.isLoading = false;
			}
		}
	},
};
</script>
<style scoped>
.lock-block{
	background-color:rgba(0,0,0,0.8);
	opacity: 0.8;
	font-size: 2em;
	color: rgb(255, 255, 0);
}
.icon{
	width: 1.3em;
	height: 1.3em;
	display: block;
}
/* 閃電鎖定 */
.icon-lock-all {
  background-image: url("data:image/png;base64,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");
  background-size: 1.3em;
}
.lock-leave-to {
	transform: translateX(100%);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.lock-leave-active{
	transition-duration: 0.3s;
	transition-property: transform;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.lock-leave {
	transform: translateX(0%);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.table-mask {
	pointer-events: all;
	background-color: rgba(0,0,0,0.8);
}
</style>
