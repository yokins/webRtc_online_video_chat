export class Signal {
    ws = null;
    messages = [];
    messageCb = null;

    offer = null;
    answer = null;

    constructor(options) {
        this.ws = new WebSocket(options.url);
        this.messageCb = options.message;
        this.messages = options.messages;

        this.ws.addEventListener("open", e => this.open(e));
        this.ws.addEventListener("message", e => this.message(e));
        this.ws.addEventListener("close", e => this.close(e));
        this.ws.addEventListener("error", e => this.error(e));
    }

    open(e) {
        // console.log("WS链接打开", e);
    }

    message(e) {
        // console.log("WS接收到了信息", e);

        if (!e.data) {
            console.log("这次收到的消息里边没有内容");
            return false;
        }

        const payload = JSON.parse(e.data);
        const getCount =
            this.messages.filter(item => item.type == "get").length + 1;

        this.messages.push({
            type: "get",
            tip: `WS第${getCount}次收到消息`,
            payload: payload,
            str: JSON.stringify(payload),
            time: new Date().getTime()
        });

        this.messageCb(payload);
    }

    close(e) {
        console.log("WS关闭", e);
        this.ws.close();
    }

    error(e) {
        console.log("WS错误", e);
    }

    send(payload) {
        const sendCount =
            this.messages.filter(item => item.type == "send").length + 1;

        this.messages.push({
            type: "send",
            tip: `WS第${sendCount}次发送消息`,
            payload: payload,
            str: JSON.stringify(payload),
            time: new Date().getTime()
        });

        this.ws.send(JSON.stringify(payload));
    }
}

export class Rtc {
    peer = null;
    config = null;

    constructor(config, icecandidate, track) {
        const RTCPeerConnection =
            window.RTCPeerConnection ||
            window.mozRTCPeerConnection ||
            window.webkitRTCPeerConnection;

        this.peer = new RTCPeerConnection(config);

        this.peer.onicecandidate = e => {
            icecandidate(e);
        };

        this.peer.ontrack = e => {
            track(e);
        };
    }

    async createOffer() {
        this.offer = await this.peer.createOffer().catch(error => {
            console.log("创建offer时发生错误", error);
        });
    }

    async createAnswer() {
        this.answer = await this.peer.createAnswer().catch(error => {
            console.log("创建answer时发生错误", error);
        });
    }

    async setLocalDescription(sdp) {
        await this.peer.setLocalDescription(new RTCSessionDescription(sdp));
    }

    async setRemoteDescription(sdp) {
        await this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
    }
}
