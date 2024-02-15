<template>
	<div class="FULL optiont-config font-size-mini">
        <div class="FULL mask" @click="$emit('close')"/>
        <div class="flex-row">
            <div class="flex-1"/>
            <div class="config-ctn flex-col pd1 pdlr3">
                <div class="flex-row pd1 hover-line flex-start" @click="onConfigColumn">
                    <i class="material-icons md-24 mgr3">playlist_add</i><span>{{$ln('栏位设定')}}</span>
                </div>
                <div class="flex-row pd1 hover-line flex-start posr">
                    <i class="material-icons md-24 mgr3">format_list_numbered</i><span>{{$ln('显示列数')}}</span>
                    <SingleSelect ref="expandCntSelect" class="FULL flex-center opacity0" :options="expandCntList" @close="$emit('close')"
                        v-model="$store.state.opt.expandCnt" :title="$ln(`各月份展开列数`)" />
                </div>
                <div class="flex-row pd1 hover-line flex-start posr divider-top mgt2 tcef"
                    @click="$store.state.opt.displayPRIADJ = !$store.state.opt.displayPRIADJ">
                    <i class="material-icons md-24 mgr3" :class="{'opacity0': !$store.state.opt.displayPRIADJ}">done</i>
                    <span>{{$ln('显示除权除息合约')}}</span>
                </div>
            </div>
            <div class="flex-1"/>
        </div>
	</div>
</template>
<script>
import ColumnConfig from "@/components/Framework/ColumnConfig.vue";
export default {
	data() {
		return {
			expandCntList: [
				{label: '2', value: 2},
				{label: '4', value: 4},
				{label: '6', value: 6},
				{label: '8', value: 8},
				{label: '10', value: 10},
				{label: 'ALL', value: 100},
			],
		}
	},
	components: {ColumnConfig},
	props:[],
	methods: {
        onConfigColumn() {
            this.$emit('close');
			eventBus.$emit("POPUP-DIALOG", ColumnConfig, {
                current: this.$store.state.opt[this.optColumnsID],
                default: this.$store.state.opt.defaultColumns,
                mode: this.isDesktop ? '' : 'split',
            }, {transName: 'float', lock: true});
        },
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		optColumnsID() {
			return this.twMode ? 'columnsV3' : 'columnsCN';
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
    }
}
</script>
<style scoped>
.desktop .optiont-config {
    right: 0.8em;
}
.mask {
    background-color: black;
    opacity: 0.5;
    z-index: 3;
}
.config-ctn {
    margin-top: 95px;
    background-color: #292C2F;
    border-radius: 0.5em;
    box-shadow: 5px 5px 5px 0px rgba(0,0,0,0.5);
    z-index: 4;
}
</style>