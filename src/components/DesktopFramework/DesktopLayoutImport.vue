<template>
    <div class="flex-col pd10">
		<textarea v-model="content"></textarea>
		<div class="flex-1"/>
		<div class="flex-row">
			<Button class="btn-confirm" @click="onExport"><i class="material-icons mgr0d5">assignment_turned_in</i>{{$ln('版面汇出')}}</Button>
			<div class="flex-1"/>
			<Button class="btn-confirm" @click="onImport"><i class="material-icons mgr0d5">assignment_returned</i>{{$ln('版面汇入')}}</Button>
		</div>
    	<div class="mgt5">
			<Button class="btn-confirm dark" @click="onRestore"><i class="material-icons mgr0d5">settings_backup_restore</i>{{$ln('恢复预设版面')}}</Button>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			content: '',
		}
	},
	beforeMount() {
		this.$emit('title', '版面汇入/汇出/恢复预设');
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onExport() {
			// deep copy layout
			let cloneLayout = JSON.parse(JSON.stringify(this.$store.state.desktop.layout));
			// 不儲存當前這個匯出彈窗
			let dskDlgList = cloneLayout.find(o=>o.selected).dskDlgList;
			let idx = dskDlgList.findIndex(o=>o.comClass==="DesktopLayoutImport");
			if (idx !== -1) dskDlgList.splice(idx, 1);
			// layout -> base64
			let strLayout = JSON.stringify(cloneLayout);
			this.content = Base64.encode(strLayout);
		},
		onImport() {
			if (this.content) {
				try {
					let strLayout = Base64.decode(this.content);
					let layout = JSON.parse(strLayout);
					if (Array.isArray(layout))
						this.$store.state.desktop.layout = layout;
				}
				catch(e) {
					this.$store.state.notify(`error`, `汇入版面格式错误`);
				}
			}
			else {
				this.content = '请再此贴上要汇入的版面设定';
			}
		},
		/** 恢復出廠預設版面 */
		onRestore() {
			let strLayout = Base64.decode(this.$store.state.config.CONFIG.DEFAULT_LAUOUT);
			let layout = JSON.parse(strLayout);
			if (Array.isArray(layout))
				this.$store.state.desktop.layout = layout;
		},
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
textarea {
	height: 300px;
}
</style>