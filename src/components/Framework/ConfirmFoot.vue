<template>
    <div class="confirm-foot flex-row">
        <div class="flex-center flex-1 fd-content-bdc tcef cancel-btn" @click="onCancel">{{$ln(`取消`)}}</div>
        <div class="flex-center flex-1 fd-content-bdc tcef confirm-btn" @click="$emit('confirm')">{{$ln(`确认`)}}</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
        onCancel() {
            eventBus.$emit("CLOSE-FLOAT-DIALOG");
        }
    },
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>