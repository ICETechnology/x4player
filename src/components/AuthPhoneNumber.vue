  <template>
	<div class="FULL">
		<div class="FULL flex-col pd5 pdlr2">
			<div class="flex-row flex-center mglr10 mgt5">
				<input type="text" class="w100p iceben-dark clr-gray2" v-model="inputPhoneNumber" :placeholder="$ln('请输入您的手机号')" />
			</div>
			<div class="flex-center mglr10 mgt5">
				<Button class="w100p btn-confirm-iceben iceben" @click="onBtnSendCode">{{$ln('发送验证码')}}</Button>
			</div>
		</div>
		<!-- 提示訊息 -->
		<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
	</div>
</template>

<script>
import InputCodeNumber from "@/components/Framework/InputCodeNumber.vue";
export default {
	props: ['param'],
	data() {
		return {
			inputPhoneNumber: "",
			sendPhoneNumber: "",
			// BlockMessage參數
			bmParam: {},
		}
	},
	beforeMount() {
		this.$emit('title', '模拟交易 - 手机注册');
		// 註冊資料分派
		M4C.regDispatch({'s': 'ac', 'c': 'vrfy.mb.s', 'callback': this.onSendResponse.bind(this)});
		M4C.regDispatch({'s': 'ac', 'c': 'vrfy.mb', 'callback': this.onVerifyResponse.bind(this)});
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		onBtnSendCode() {
			if (!this.inputPhoneNumber) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("请输入手机号"));
				return;
			}
			// 清除最後輸入的驗證碼
			this.$store.state.status.inputCodeNumber = '';
			// 即將送出的號碼
			this.sendPhoneNumber = this.inputPhoneNumber;
			// 支持密技號碼
			if (this.sendPhoneNumber.indexOf('9999999999') === 0) {
				this.onConfirmPhoneNumber();
				return;
			}
			// 支持指定國碼
			if (this.sendPhoneNumber.indexOf('+') !== 0)
				this.sendPhoneNumber = `+86-${this.sendPhoneNumber}`;
			// 顯示提示
			this.bmParam = {display: true, head: '验证码机制', body: '正在送出验证码', showLoadingIcon: true};
			this.sendCodeTimeout = setTimeout(self=>{
				this.bmParam = {display: true, head: '验证码机制', body: '验证码发送逾时失败', showConfirmBtn: true};
			}, 9988, this);
			// 送出手機號
			let cmd = {
				s: 'ac',
				c: 'vrfy.mb.s',
				r: ''.random(),
				rc: '',
				d: {
					comp: window.comp,
					m: this.sendPhoneNumber,
				},
			};
			M4C.send(cmd, 'quote');
		},
		confirmInputCode() {
			if (!this.inputCodeNumber || this.inputCodeNumber.length < 4) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("请输入完整简讯认证码"));
				return "NOT-CLOSE";
			}
			// 顯示提示
			this.bmParam = {display: true, head: '验证码机制', body: '正在检查验证码', showLoadingIcon: true};
			this.verifyCodeTimeout = setTimeout(self=>{
				this.bmParam = {display: true, head: '验证码机制', body: '验证码检查逾时失败', showConfirmBtn: true};
			}, 9988, this);
			// 進行驗證
			let cmd = {
				s: 'ac',
				c: 'vrfy.mb',
				r: ''.random(),
				rc: '',
				d: {
					comp: window.comp,
					m: this.sendPhoneNumber,
					c: this.inputCodeNumber.slice(0,4),
				},
			};
			M4C.send(cmd, 'quote');
		},
		// 送出手機號碼的回覆
		onSendResponse(data) {
			clearTimeout(this.sendCodeTimeout);
			// 成功
			if (data.cd === 1) {
				// 關閉提示
				this.bmParam = {display: false};
				// 彈出輸入驗證碼視窗
				eventBus.$emit("CONFIRM-DIALOG", {
					top: '30%',
					title: '请输入收到的验证码',
					contentComponent: InputCodeNumber,
					disableClickMaskClose: true,
					confirm: this.confirmInputCode,
				});
			}
			// 失敗
			else {
				// 顯示提示
				this.bmParam = {display: true, head: '验证码机制', body: `(${data.cd}) ${this.$ln('验证码发送失败')}`, showLoadingIcon: false, showConfirmBtn: true};
			}
		},
		// 送出驗證碼的回覆
		onVerifyResponse(data) {
			clearTimeout(this.verifyCodeTimeout);
			if (data.cd === 1) {
				// 關閉提示
				this.bmParam = {display: false};
				this.onConfirmPhoneNumber();
			}
			else {
				// 顯示提示
				this.bmParam = {display: true, head: '验证码机制', body: `(${data.cd}) ${this.$ln('验证码检核失败')}`, showLoadingIcon: false, showConfirmBtn: true};
			}
		},
		// 驗證碼通過時，將門號塞入
		onConfirmPhoneNumber() {
			this.$store.state.sim.thirdPartyType = "PHONE-NUMBER";
			this.$store.state.sim.phoneNumber = this.sendPhoneNumber;
			// 關閉本視窗 (上個畫面會負責啟動登入)
			setTimeout(()=>{eventBus.$emit("CLOSE-DIALOG");}, 50);
		},
	},
	watch: {},
	computed: {
		inputCodeNumber() {
			return this.$store.state.status.inputCodeNumber;
		},
	},
}
</script>

<style scoped>
</style>