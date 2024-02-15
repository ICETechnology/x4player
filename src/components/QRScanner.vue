<template>
    <div class="qr-scanner-ctn flex-col flex-center">
		<div ref="scan-ctn" class="flex-2 flex-col" :class="{'bgc-transparent': $store.state.bgcTransparent}">
			<span>{{$ln('手機扫描说明')}}</span>
			<div class="flex-1 flex-center">
				<!-- 瞄準器 -->
				<div class="aim posa">
					<div class="lt"></div>
					<div class="rt"></div>
					<div class="lb"></div>
					<div class="rb"></div>
				</div>
			</div>
		</div>
		<div class="flex-1 w100p bgc-white flex-center">
			<div class="clr-black pd5" v-html="scanHelp" />
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		// 要求權限
		if (window.QRScanner)
			window.QRScanner.prepare(this.prepareResult);		
	},
    mounted() {},
	beforeDestroy() {
		this.$store.state.bgcTransparent = false;
		QRScanner.destroy();
	},
	components: {},
    methods: {
		// 要求權限的結果
		prepareResult(err, status){
			if (err){
				console.error('QRScanner.prepare() error :', err._message);
			} else {
				this.$store.state.bgcTransparent = true;
				console.log('QRScanner is initialized. Status:', status);
				QRScanner.scan(this.scanResult);
				QRScanner.show(()=>{});
			}
		},
		scanResult(err, contents){
			let self = this;
			if (err){
				console.error('QRScanner.scan() error :', err._message);
			}
			else {
				console.log('QRScanner.scan() contents :', contents);
				// this.$store.state.notify(contents);
				let result = JSON.parse(contents);
				// 檢查 company
				if (result.company !== window.comp) {
					this.$store.state.notify('error', `${this.$ln('公司号匹配错误，无法同步')}`);
					return;
				}
				// 彈出確認視窗
				eventBus.$emit("CONFIRM-DIALOG", {
					title: self.$ln("同步设定"),
					content: self.$ln("扫描完成，确认进行同步 ?"),
					confirm: ()=>{
						// 儲存同步之前的 deviceID，未來可提供解除同步所使用
						self.$store.state.device.orginDeviceID = self.$store.state.device.deviceID;
						// 更新為掃描進來的 deviceID
						self.$store.state.device.deviceID = result.deviceID;
						self.$set(self.$store.state.device.bundleDevice, "deviceID", result.deviceID);
						self.$set(self.$store.state.device.bundleDevice, "prod", result.product);
						// 關閉本畫面
						eventBus.$emit("CLOSE-DIALOG");
					},
					cancel: ()=>{
						QRScanner.scan(this.scanResult);
					},
				});
			}
		},
	},
	watch: {},
    computed: {
		scanHelp() {
			return this.$ln('扫描桌机行动条码HTML说明');
		},
	},
}
</script>

<style scoped>
.aim {
	width: 35vw;
	height: 35vw;
}
.aim div {
	position: absolute;
	width: 25%;
	height: 25%;
	opacity: 0.5;
	box-sizing: border-box;
}
.aim .lt {
	top: 0;
	left: 0;
	border-top: 5px solid white;
	border-left: 5px solid white;
}
.aim .rt {
	top: 0;
	right: 0;
	border-top: 5px solid white;
	border-right: 5px solid white;
}
.aim .lb {
	left: 0;
	bottom: 0;
	border-left: 5px solid white;
	border-bottom: 5px solid white;
}
.aim .rb {
	right: 0;
	bottom: 0;
	border-right: 5px solid white;
	border-bottom: 5px solid white;
}

</style>