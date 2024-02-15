<template>
    <div class="smo-agreement-config flex-col pdb5">
		<div class="flex-center mgtb5">
			<i class="material-icons clr-orange md-72">check_circle_outline</i>
		</div>
		<div v-if="!twMode" class="flex-col mglr5 pdlr5 mgb5">
			<div>{{$ln('异常通知邮件信箱：')}}</div>
			<div class="mgtb3 flex-col">
				<input ref="emailInput" type="text" class="iceben clr-white sys-bgc font-size-small" v-model="inputEmail" :placeholder="$ln('请输入电子邮件信箱')" />
				<span class="clr-warn" v-if="inputEmail && !isEmailValid">{{$ln('無效的Email格式')}}</span>
			</div>
			<Button class="iceben pdtb1" @click="onBtnSave">{{$ln('保存')}}</Button>
		</div>
		<div class="mgt5 mglr5 pdl2">{{$ln('云端洗价服务同意书')}}</div>
		<div class="flex-1 content-ctn mg5 pdlr4 posr">
			<SmoAgreementContent class="pdlr5" />
		</div>
		<div class="pdlr5">
			<Button class="iceben orange mg5 mgt1 pdtb1" @click="onBtnCancel">{{$ln('取消，不同意')}}</Button>
		</div>
    </div>
</template>

<script>
import SmoAgreementContent from "@/components/SmoAgreementContent.vue";
export default {
	props: [],
	data() {
		return {
			inputEmail: '',
			htmlContent: '',
		}
	},
	beforeMount() {},
    mounted() {
		this.$emit('title', '云端条件单');
		this.inputEmail = this.$store.state.config.smoAlertEmail;
	},
	beforeDestroy() {},
	components: {SmoAgreementContent},
    methods: {
		// 保存電子郵件
		onBtnSave() {
			if (!this.inputEmail) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("请输入电子邮件信箱"));
				return;
			}
			if (!this.isEmailValid) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("無效的Email格式"));
				this.$refs.emailInput.focus();
				return;
			}

			this.$store.state.config.smoAlertEmail = this.inputEmail;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln("云端洗价同意书"),
				content: this.$ln("异常通知邮件信箱设定完成"),
				confirmOnly: true,
			});
			// 對所有連線送出更新同意書
			M4C.SmoAgreement.updateAgreementAll();
		},
		// 取消同意書 -> 關閉持續連線，移除同意書設定
		onBtnCancel() {
			this.$store.state.config.localSmoAgreementVersion = null;
			eventBus.$emit("CLOSE-DIALOG");
			// 對所有連線送出關閉持續性連線
			M4C.GTC.requestCloseAll();
			// 對所有連線送出移除同意書
			M4C.SmoAgreement.removeAgreementAll();
		},
	},
	watch: {},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		// Email 是否有效
		isEmailValid() {
			// An email address must not exceed 254 characters.
			if (this.inputEmail.length > 254)
				return false;
			return this.inputEmail.match(
				/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			);
  		},
	},
}
</script>

<style scoped>
input {
	width: 100%;
	border: 1px solid #808080;
	height: 2.4em;
}
.content-ctn {
	border: 1px solid #333;
	border-radius: 0.5em;
}
</style>