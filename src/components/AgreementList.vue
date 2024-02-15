<template>
	<div v-if="displayAgreementList.length > 0" class="FULL agreement-list-ctn zindex-99">
		<!-- 逐張同意書 -->
		<div v-for="obj in displayAgreementList" :key="`require-agree-${obj.key}`" class="FULL flex-col">
			<!-- 標題 -->
			<div v-if="!displayKey" class="head bgc-head pd3" v-html="obj.head"></div>
			<!-- 內文 -->
			<div class="body flex-1 font-size-mini pd2" v-html="obj.body"></div>
			<!-- 啟動情境 : 離開或繼續使用 -->
			<div v-if="!displayKey" class="flex-row pd3 bgc-222 bgc-foot">
				<Button class="btn-confirm dark" @click="onClose">{{$ln('离开')}}</Button>
				<div class="flex-1"/>
				<Button class="btn-confirm" @click="onConfirm(obj.key)">{{$ln('继续使用')}}</Button>
			</div>
			<!-- 檢視情境 : 撤銷 -->
			<div v-if="acceptRevoke" class="flex-row pd3 bgc-222 bgc-foot flex-center">
				<Button class="btn-confirm dark" @click="onRevoke(obj.key)">{{$ln('撤销')}}</Button>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			// 已同意的同意書
			confirmAgreeList: [],
		}
	},
	beforeMount() {
		this.confirmAgreeList = this.$store.state.config.confirmAgreement.split(',');
		if (this.displayKey)
			this.$emit('title', this.displayAgreement.head);
		if (!this.displayAgreementList.length)
			eventBus.$emit("ONCLOSE-AGREE")
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		// 關閉離開
		onClose(){
			// 手機版
			if (window.navigator.app)
				window.navigator.app.exitApp();
			// 瀏覽器
			else
				window.location.reload();
		},
		onConfirm(key) {
			this.confirmAgreeList.push(key);
			if(!this.displayAgreementList.length)
				eventBus.$emit("ONCLOSE-AGREE")
		},
		// 移除此同意書的key
		removeAgreementKey(key) {
			this.confirmAgreeList.splice(this.confirmAgreeList.indexOf(key), 1);
		},
		// 撤销
		onRevoke(key) {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln("撤销同意书"),
				content: this.$ln("撤销同意书将自动登出"),
				confirm: () => {
					this.removeAgreementKey(key);
					eventBus.$emit("CLOSE-CONFIRM");
					setTimeout(()=>{window.location.reload();}, 200);
				}
			});
		},
	},
	watch: {
		// 把本地的同意列表同步至 config.confirmAgreement (自動儲存)
		confirmAgreeList() {
			this.$store.state.config.confirmAgreement = this.confirmAgreeList.join(',');
		},
	},
	computed: {
		// 指定同意書的 key
		displayKey() {
			return this.param && this.param.key ? this.param.key : null;
		},
		// 指定同意書
		displayAgreement() {
			return this.displayAgreementList[0] || {};
		},
		// 指定同意書是否可註銷
		acceptRevoke() {
			return this.displayKey && this.displayAgreement.acceptRevoke;
		},
		// 所有的同意書
		totalAgreementList() {
			return this.$store.state.config.publicPdSetting.agreement || [];
		},
		// 仍須同意的同意書
		requireAgreementList() {
			return this.totalAgreementList.filter(obj=>{
				return this.confirmAgreeList.indexOf(obj.key) === -1;
			});
		},
		// 要顯示的同意書
		displayAgreementList() {
			if (this.displayKey) {
				return this.totalAgreementList.filter(obj=>{
					return obj.key === this.param.key;
				});
			}
			else
				return this.requireAgreementList.reverse();
		},
	},
}
</script>

<style scoped>
.body {
	background-color:white;
	overflow: auto;
	color:black;
	font-weight: bold;
}
.agreement-list-ctn .btn-confirm {
	width: 32vw;
    height: 10vw;
    border-radius: 2vw;
}
</style>