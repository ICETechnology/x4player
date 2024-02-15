<template>
	<TabGroup class="mix-rigth-afterhours-tab-group" ref="mix-rigth-afterhours-tab-group" tabKey="mix-rigth-afterhours" disablePrevNext='true'
			:tabList="tabList"/>
</template>
<script>
import Rights from '@/components/Rights.vue';
import RightsAfterhours from '@/components/RightsAfterhours.vue';

export default {
	props: ["suspend"],
	data() {
		return {
            tabList: [
                {
                  comClass: Rights,
                  label: "權益數查詢"
                },
                {
                  comClass: RightsAfterhours,
                  label: "夜盤查詢"
                },
            ]
        }
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods:{},
	watch: {},
    computed: {}
}
</script>