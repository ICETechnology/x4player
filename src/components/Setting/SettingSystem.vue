<template>
    <div class="flex-col pdt2 font-size-small overflow-y-auto" v-touching="`.touching-effect`">
		<div class="setting-line flex-row" v-if="!$store.state.config.CONFIG.NO_LANG_ITEM">
			<div class="flex-1 flex-start clr-gray">{{$ln(`系统语系`)}}</div>
			<div class="flex-center">
				<SingleSelect class="w40vw" :options="optList" v-model="$store.state.lang.language" />
			</div>
		</div>
		<div class="setting-line flex-row">
			<div class="flex-1 flex-start clr-gray">{{$ln(`输入方式`)}}</div>
			<div class="flex-center">
				<radio class="radio-ctn flex-row bgc-white clr-black" v-model="$store.state.config.inputType">
					<span value="K">{{$ln(`键盘`)}}</span>
					<span value="S">{{$ln(`卷动`)}}</span>
				</radio>
			</div>
		</div>
		<div class="setting-line flex-row" v-if="!isDesktop">
			<div class="flex-1 flex-start clr-gray">{{$ln(`再次显示新手教学`)}}</div>
			<div class="flex-center">
				<Button class="pdlr3" @click="onClickHelper">{{$ln(`设定`)}}</Button>
			</div>
		</div>
		<div class="setting-line flex-row" v-if="!isDesktop">
			<div class="flex-1 flex-start clr-gray">{{$ln(`再次显示新功能展示`)}}</div>
			<div class="flex-center">
				<Button class="pdlr3" @click="onResetToolip">{{$ln(`设定`)}}</Button>
			</div>
		</div>
		<div class="setting-line flex-row">
			<div class="flex-1 flex-start clr-gray">{{$ln(`库存商品自动加入关注`)}}</div>
			<div class="flex-center">
				<radio class="radio-ctn flex-row mgr1" v-model="$store.state.config.posListAddToFocusList">
					<span value="true">{{$ln(`是`)}}</span>
					<span value="false">{{$ln(`否`)}}</span>
				</radio>
			</div>
		</div>
		<div class="setting-line flex-row">
			<div class="flex-1 flex-start clr-gray">{{$ln(`推播通知设定`)}}</div>
			<div class="flex-center">
				<Button class="pdlr3" @click="onClickOpenSetting">{{$ln(`设定`)}}</Button>
			</div>
		</div>
		<div class="setting-line flex-row">
			<div class="flex-1 flex-start clr-gray">{{$ln(`不进入休眠`)}}</div>
			<div class="flex-center">
				<Toggle v-model="$store.state.config.keepAwake" />
			</div>
		</div>
		<div class="setting-line flex-row">
			<div class="flex-1 flex-start clr-gray">{{$ln(`显示模式设定`)}}</div>
			<div class="flex-center">
				<radio class="radio-ctn flex-row bgc-white clr-black" v-model="$store.state.config.largeSize">
					<span value="false">{{$ln(`预设字型`)}}</span>
					<span value="true">{{$ln(`大字型`)}}</span>
				</radio>
			</div>
		</div>
		<div class="flex-row setting-line touching-effect hover-line" @click="openSetting">
			<div class="flex-1 flex-start clr-gray">{{$ln(`音效设定`)}} <span :class="{'effect_on':effectStatus}">　(狀態: {{ effectStatus ? "ON" : "OFF" }})</span> </div>
			<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
		</div>
		<div class="setting-line flex-row" v-if="!$store.state.config.CONFIG.NO_LANG_ITEM">
			<div class="flex-1 flex-start clr-gray">{{$ln(`滑鼠点击连动`)}}</div>
			<div class="flex-center">
				<SingleSelect class="w40vw" :options="syncModeList" v-model="$store.state.config.syncMode" />
			</div>
		</div>
		<div class="setting-line flex-row" v-if="twMode && screenshotPlugin">
			<div class="flex-1 flex-start clr-gray">{{$ln(`螢幕截圖`)}}</div>
			<div class="flex-center">
				<Toggle v-model="$store.state.device.screenShotProtect" />
			</div>
			<!-- 不重複開發，直接引用元件方式處理(但不顯示) -->
			<ScreenShotBlock class="hidden" mode="1" v-model="$store.state.device.screenShotProtect"/>
		</div>
    </div>
</template>

<script>
import SettingAdvanceEffect from "@/components/Setting/SettingAdvanceEffect.vue";
import ScreenShotBlock from "@/components/ScreenShotBlock.vue";
export default {
	props: [],
	data() {
		return {
			optList: [
				{label:'繁體',value:'zh-TW'},
				{label:'简体',value:'zh'},
				{label:'English',value:'en'}
			],
			syncModeList: [
				{label: '版面内', value: 'layout'},
				{label: '整个软件', value: 'system'},
			],
		}
	},
	beforeMount() {},
    mounted() {this.$emit('title', this.$ln('系统设定'))},
	beforeDestroy() {},
	components: {SettingAdvanceEffect, ScreenShotBlock},
    methods: {
		/** 登出 */
		onBtnLogout() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "登出",
				content: this.$ln("点击确认登出"),
				confirm: () => {
					localStorage.removeItem(this.$store.state.config.projectID + '_AUTO_LOGIN');
					window.location.reload();
				}
			});
		},
		/** 重启 */
		onBtnReload() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "重启",
				content: this.$ln("点击确认重启"),
				confirm: () => {
					eventBus.$emit("CLOSE-CONFIRM");
					this.isLoading = true;
					setTimeout(()=>{
						window.location.reload();
					}, 200);
				}
			});
		},
		/** 重新顯示新手教學 */
		onClickHelper() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `新手教学`,
				content: this.$ln(`设定为再次显示新手教学`),
				confirm: () => {
					self.$store.state.helper = {};
				}
			});
		},
		/** 重新显示新功能展示 */
		onResetToolip() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `新功能展示`,
				content: this.$ln(`设定为再次显示新功能展示`),
				confirm: () => {
					self.$store.state.components.tooltip.reset();
				}
			});
		},
		/** 推播通知设定 */
		onClickOpenSetting() {
			let targetID = this.$store.state.device.isDeviceIOS ? 'application_details' : 'notification_id';
			try{window.cordova.plugins.settings.open(targetID);}catch(e){}
		},
		openSetting(){
			eventBus.$emit("POPUP-DIALOG", SettingAdvanceEffect, "", {'$HEAD': {'title': '进阶设定'}, transName: 'float'});
		}
	},
	watch: {
		lang: function(nv, ov){
			this.$store.commit("setLanguage", nv);
		},
	},
    computed: {
		effectStatus(){
			return this.$store.state.config.fllowEffect || this.$store.state.config.soundEffect || this.$store.state.config.dataEffect
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		lang() {
			return this.$store.state.lang.language;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		screenshotPlugin() {
			try {return window.plugins.preventscreenshot;} catch(e) {}
		}, 
	},
}
</script>

<style scoped>
.radio-ctn {
    border: 1px solid #7E8185;
}
.effect_on{
	color: rgb(95, 207, 16);
}
</style>