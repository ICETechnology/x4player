<template>
	<div class="m4c-console hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			mapRtoCommand: {},
		}
	},
	beforeMount() {
		M4C.Console = this;
	},
	mounted() {
		// 檢查未被回覆正確清除的命令
		setInterval(this.checkUnclearCommand, 30000);
	},
	beforeDestroy() {},
	components: {},
	methods: {
		// log send command
		logSend({wsConn, strData, objData}) {
			if (objData && objData.r && objData.s !== 'analysis')
				this.mapRtoCommand[objData.r] = {time: new Date(), strData};
			// 支持只印要印的 service/command
			let approveLog = this.consoleFilter(objData);
			if (!approveLog) return;
			let strLog = strData;
			// 支持不印各種 XXXXXX_PWD 欄位
			if (objData.d && strData.includes('_PWD')) {
				let tmp = JSON.parse(JSON.stringify(objData));
				if (tmp.d.TRADER_PWD)	tmp.d.TRADER_PWD = "[NOT-LOG-FOR-SECURITY]";
				if (tmp.d.ACCOUNT_PWD)	tmp.d.ACCOUNT_PWD = "[NOT-LOG-FOR-SECURITY]";
				if (tmp.d.BANK_PWD)		tmp.d.BANK_PWD = "[NOT-LOG-FOR-SECURITY]";
				if (tmp.d.ENCRYPT_PWD)	tmp.d.ENCRYPT_PWD = "[NOT-LOG-FOR-SECURITY]";
				if (tmp.d.OLD_PWD)		tmp.d.OLD_PWD = "[NOT-LOG-FOR-SECURITY]";
				if (tmp.d.NEW_PWD)		tmp.d.NEW_PWD = "[NOT-LOG-FOR-SECURITY]";
				strLog = JSON.stringify(tmp);
			}
			console.log(M4C.getWsConnMark(wsConn), `M4C.send`, strLog);
		},
 		logData({wsConn, str, data}) {
			// 支持 consoleFilter 過濾是否要印該筆資料
			let approveLog = this.consoleFilter(data);
			if (approveLog) {
				// 有 gzip 內容的不送往 cloud
				if (data.d && data.d.$data && data.d.$data.gzip)
					console.log(M4C.getWsConnMark(wsConn), `M4C.onData`, str, {NOT_TO_CLOUD: true});
				else
					console.log(M4C.getWsConnMark(wsConn), `M4C.onData`, str);
			}
			if (data.cd < 0 && this.mapRtoCommand[data.r])
				console.log(M4C.getWsConnMark(wsConn), '[異常] 命令 : ', this.mapRtoCommand[data.r].strData, ', 回覆 cd < 0 : ', str);

			delete this.mapRtoCommand[data.r];
		},
		// 支持 consoleFilter 過濾是否要印該筆資料
		consoleFilter(data) {
			if (this.logConsole[`${data.s}`] === 0)
				return false;
			else if (this.logConsole[`${data.s}/${data.c}`] === 0)
				return false;
			return true;
		},
		// 檢查未被回覆正確清除的命令
		checkUnclearCommand() {
			let now = new Date();
			for (let rkey in this.mapRtoCommand) {
				if (this.mapRtoCommand[rkey] && this.mapRtoCommand[rkey].time) {
					let diff = now - this.mapRtoCommand[rkey].time;
					if (diff > 10000) {
						console.log('[異常] 命令超過 10 秒無回應 : ', this.mapRtoCommand[rkey].strData);
						delete this.mapRtoCommand[rkey];
					}
				}
			}
		},
	},
	watch: {},
	computed: {
		logConsole() {
			return this.$store.state.logConsole;
		}
	},
}
</script>

<style scoped>
</style>