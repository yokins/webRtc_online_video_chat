<template>
    <div>
        <n-button @click="onClickClose">关闭信令链接</n-button>
        <hr />
        <div class="videos">
            <video autoplay id="my"></video>
            <video autoplay id="other"></video>
        </div>
        <hr />
        <n-timeline>
            <n-timeline-item
                v-for="(message, index) in messages"
                :key="index"
                type="success"
                :title="message.tip"
                :content="message.str"
                :time="message.time"
            />
        </n-timeline>
    </div>
</template>

<script>
import { Signal, Rtc } from "./rtc.js";

export default {
    data() {
        return {
            signal: null,
            peer: null,
            // rtc: null,
            messages: [],

            uuid: null,
            otherUuid: null,

            myVideo: null,
            otherVideo: null,

            steam: null,

            sender: null
        };
    },

    async created() {
        this.$nextTick(async () => {
            this.myVideo = document.getElementById("my");
            this.otherVideo = document.getElementById("other");

            this.stream = await navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .catch(() => {});
            this.myVideo.srcObject = this.stream;

            this.signal = new Signal({
                url: "wss://p.senkoo.cn",
                message: this.message,
                messages: this.messages
            });

            this.rtc = new Rtc(
                {
                    iceServers: [
                        {
                            urls: "stun:43.142.234.52:3478"
                        }
                    ]
                },
                this.icecandidate,
                this.track
            );

            this.stream.getTracks().forEach(track => {
                this.sender = this.rtc.peer.addTrack(track, this.stream);
            });

            // this.rtc.peer.addStream(this.stream);
        });
    },

    beforeUnmount() {
        this.signal.send({
            operate: "leave-room",
            rid: 1
        });
        this.signal.close();
        this.rtc.peer.removeTrack(this.sender);
        this.rtc.peer.close();
    },

    methods: {
        onClickClose() {
            this.signal.close();
        },
        async message(payload) {
            const operate = payload.operate;

            switch (operate) {
                case "connected":
                    this.uuid = payload.uuid;
                    this.signal.send({
                        operate: "join-room",
                        rid: 1,
                        uuid: this.uuid
                    });
                    break;
                case "join-room":
                    if (payload.room_users.length > 1) {
                        this.otherUuid = payload.room_users[0];

                        await this.rtc.createOffer();
                        await this.rtc.setLocalDescription(this.rtc.offer);
                        this.signal.send({
                            operate: "sdp-offer",
                            sdp: this.rtc.offer,
                            uuid: this.uuid,
                            remote_uuid: this.otherUuid
                        });
                    }
                    break;
                case "new-join-room":
                    this.otherUuid = payload.uuid;
                    break;
                case "leave-room":
                    break;
                case "sdp-offer":
                    // 接收offer的人
                    this.rtc.setRemoteDescription(payload.sdp);
                    await this.rtc.createAnswer();
                    this.signal.send({
                        operate: "sdp-answer",
                        sdp: this.rtc.answer,
                        uuid: this.uuid,
                        remote_uuid: this.otherUuid
                    });
                    await this.rtc.setLocalDescription(this.rtc.answer);
                    break;
                case "sdp-answer":
                    this.rtc.setRemoteDescription(payload.sdp);
                    break;
                case "candidates":
                    this.rtc.peer.addIceCandidate(payload.candidates);
                    break;
                default:
                    break;
            }
        },

        icecandidate(e) {
            if (e.candidate) {
                console.log("🚀 ~ file: App.vue ~ line 152 ~ icecandidate ~ e.candidate", e.candidate)
                this.signal.send({
                    operate: "candidates",
                    remote_uuid: this.otherUuid,
                    uuid: this.uuid,
                    candidates: e.candidate
                });
            } else {
                console.log(e);
            }
        },

        track(e) {
            console.log("🚀 ~ file: App.vue ~ line 164 ~ track ~ e", e);
            if (e && e.streams) {
                this.otherVideo.srcObject = e.streams[0];
                console.log(
                    "🚀 ~ file: App.vue ~ line 167 ~ track ~ this.otherVideo",
                    this.otherVideo
                );
            }
        }
    }
};
</script>

<style>
.videos {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-around;
}

video {
    width: 400px;
    height: 400px;
}

video:first-child {
    border: 1px solid red;
}

video:last-child {
    border: 1px solid blue;
}
</style>
