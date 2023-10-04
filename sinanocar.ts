/* sinano_car V1.1 1023/10/02
超音波センサ
    Tri P14
    Eco P10
左・フォトリフレクター（B input)
    P3
右・フォトリフレクター(A input)
    P4
モータードライバ
    INT1 P2
    INT2 P13
    INT3 P15
    INT4 P16
                Left wheel          Right wheel
                P2      P13         P15     P16
    forward     1       0           0       1
    back        0       1           1       0
    left        0       1           0       1
    right       1       0           1       0
左ホイール・フォトセンサー(D input)
    P7
右ホイール・フォトセンサー(C input)
    P6
ネオピクセル用
    P9
あまり
    P0, P8,
電圧検出
    P1
カラーセンサー
    I2C
*/

let 走行モード = 0
let ステップモード = 0
let L_U = 0
let L_e_pre = 0
let L_ie = 0
let L_e = 0
let L_r = 0
let L_y = 0
let R_U = 0
let R_e_pre = 0
let R_ie = 0
let R_e = 0
let R_r = 0
let R_y = 0
let 左カウンター = 0
let 右カウンター = 0
let T = 0
let L_ki = 0
let L_kp = 0
let R_ki = 0
let R_kp = 0

R_kp = 20
R_ki = 15
L_kp = 20
L_ki = 15

// 制御周期分だけ待つ処理（ｍｓ）
T = 0.01
pins.setPull(DigitalPin.P6, PinPullMode.PullNone)
pins.setPull(DigitalPin.P7, PinPullMode.PullNone)
led.enable(false)
pins.setEvents(DigitalPin.P6, PinEventType.Pulse)
pins.setEvents(DigitalPin.P7, PinEventType.Pulse)

let noservo = 0
led.enable(false)
let color_value = 0
let volt = 0


let neo_sinamon = neopixel.create(DigitalPin.P9, 2, NeoPixelMode.RGB)
neo_sinamon.setBrightness(15)



//% color="#ff4500" weight=94 
namespace sinamon {

    export enum direction {
        //% block="forward"
        forward,
        //% block="right",
        right,
        //% block="left",
        left,
        //% block="right_rotation",
        right_rotation,
        //% block="left_rotation",
        left_rotation,
        //% block="backward",
        backward,
        //% block="Stop",
        Stop
    }

    export enum direction2 {
        //% block="forward"
        forward,
        //% block="right_rotation",
        right_rotation,
        //% block="left_rotation",
        left_rotation,
        //% block="backward",
        backward
    }

    let volt = pins.analogReadPin(AnalogPin.P1) / 500 * 6

    export enum kyori {
        //% block="long"
        long,
        //% block="short",
        short
    }



    export enum onoff {
        //% block="ON"
        ON,
        //% block="OFF"
        OFF
    }
    export enum whiteblack {
        //% block="black"
        black,
        //% block="white"
        white
    }




    export enum colorcycle {
        //% block="cycle1"
        cycle1,
        //% block="cycle10",
        cycle10,
        //% block="cycle42",
        cycle42,
        //% block="cylce64",
        cycle64,
        //% block="cycle256",
        cycle256
    }

    export enum colorgain {
        //% block="1×gain"
        gain1,
        //% block="4×gain",
        gain4,
        //% block="16×gain",
        gain16,
        //% block="60×gain",
        gain60
    }






    pins.onPulsed(DigitalPin.P6, PulseValue.High, function () {
        右カウンター += 1
    })
    pins.onPulsed(DigitalPin.P6, PulseValue.Low, function () {
        右カウンター += 1
    })
    pins.onPulsed(DigitalPin.P7, PulseValue.High, function () {
        左カウンター += 1
    })
    pins.onPulsed(DigitalPin.P7, PulseValue.Low, function () {
        左カウンター += 1
    })


    //% color="#3943c6" weight=88 
    //% block="Move |%sinkou_houkou|,power|%Power|" group="1 Basic movement"
    //% Power.min=0 Power.max=100 Power.defl=100
    export function car_derection(sinkou_houkou: direction, Power: number): void {
        //pins.setEvents(DigitalPin.P6, PinEventType.None)
        //pins.setEvents(DigitalPin.P7, PinEventType.None)

        switch (sinkou_houkou) {
            case direction.forward:
                連続前進()
                break;
            case direction.left:
                連続左折()
                break;
            case direction.right:
                連続右折()
                break;
            case direction.right_rotation:
                連続右回転()
                break;
            case direction.left_rotation:
                連続左回転()
                break;
            case direction.backward:
                連続後進()
                break;
            case direction.Stop:
                pins.analogWritePin(AnalogPin.P2, 0)
                pins.analogWritePin(AnalogPin.P13, 0)

                pins.analogWritePin(AnalogPin.P15, 0)
                pins.analogWritePin(AnalogPin.P16, 0)
                break;
        }
    }




    //% color="#3943c6" weight=89 
    //% block="Move |%sinkou_houkou|,|%step|step" group="1 Basic movement"
    //% step.min=0 step.max=50 Power.defl=0
    export function car_stepmove(sinkou_houkou: direction2, step: number): void {
        switch (sinkou_houkou) {
            case direction2.forward:
                ステップ前(step)
                break;
            case direction2.right_rotation:
                ステップ右回転(step)
                break;
            case direction2.left_rotation:
                ステップ左回転(step)
                break;
            case direction2.backward:
                ステップ後ろ(step)
                break;
        }
    }







function 左回転(STEP: number) {
    右カウンター = 0
    左カウンター = 0
    while (true) {
        basic.pause(10)
        // 現時刻の情報取得
        R_y = 右カウンター
        // 目標値
        R_r = STEP
        // PID制御の式
        R_e = R_r - R_y
        R_ie = R_ie + (R_e + R_e_pre) * T / 2
        R_U = R_kp * R_e + R_ki * R_ie
        if (R_U >= 1023) {
            R_U = 1023
        } else if (R_U <= 0) {
            R_U = 0
        }
        pins.analogWritePin(AnalogPin.P16, R_U)
        pins.digitalWritePin(DigitalPin.P15, 0)
        R_e_pre = R_e
        // 現時刻の情報取得
        L_y = 左カウンター
        // 目標値
        L_r = STEP
        // PID制御の式
        L_e = L_r - L_y
        L_ie = L_ie + (L_e + L_e_pre) * T / 2
        L_U = L_kp * L_e + L_ki * L_ie
        if (L_U >= 1023) {
            L_U = 1023
        } else if (L_U <= 0) {
            L_U = 0
        }
        serial.writeNumbers([左カウンター, L_U])
        pins.analogWritePin(AnalogPin.P13, L_U)
        pins.digitalWritePin(DigitalPin.P2, 0)
        L_e_pre = L_e
        if (STEP <= L_y && STEP <= R_y) {
            pins.digitalWritePin(DigitalPin.P2, 0)
            pins.digitalWritePin(DigitalPin.P13, 0)
            pins.digitalWritePin(DigitalPin.P15, 0)
            pins.digitalWritePin(DigitalPin.P16, 0)
            basic.pause(200)
            break;
        }
    }
}


function ステップ後ろ(数値: number) {
    ステップモード = 2
    ステップ動作(数値)
}
function ステップ左回転(数値: number) {
    ステップモード = 3
    ステップ動作(数値)
}

function 連続右回転() {
    走行モード = 6
    pins.digitalWritePin(DigitalPin.P13, 0)
    pins.analogWritePin(AnalogPin.P2, 1023)
    pins.digitalWritePin(DigitalPin.P16, 0)
    pins.analogWritePin(AnalogPin.P15, 1023)
}
function 連続前進() {
    左カウンター = 0
    右カウンター = 0
    走行モード = 1
    pins.analogWritePin(AnalogPin.P2, 1023)
    pins.digitalWritePin(DigitalPin.P13, 0)
    pins.digitalWritePin(DigitalPin.P15, 0)
    pins.analogWritePin(AnalogPin.P16, 1023)
}
function 連続後進() {
    走行モード = 2
    pins.digitalWritePin(DigitalPin.P2, 0)
    pins.analogWritePin(AnalogPin.P13, 1023)
    pins.digitalWritePin(DigitalPin.P16, 0)
    pins.analogWritePin(AnalogPin.P15, 1023)
}
function 連続左折() {
    走行モード = 5
    pins.digitalWritePin(DigitalPin.P13, 0)
    pins.analogWritePin(AnalogPin.P2, 0)
    pins.digitalWritePin(DigitalPin.P15, 0)
    pins.analogWritePin(AnalogPin.P16, 1023)
}
function 連続左回転() {
    走行モード = 3
    pins.digitalWritePin(DigitalPin.P2, 0)
    pins.analogWritePin(AnalogPin.P13, 1023)
    pins.digitalWritePin(DigitalPin.P15, 0)
    pins.analogWritePin(AnalogPin.P16, 1023)
}
function 連続右折() {
    走行モード = 4
    pins.digitalWritePin(DigitalPin.P13, 0)
    pins.analogWritePin(AnalogPin.P2, 1023)
    pins.digitalWritePin(DigitalPin.P16, 0)
    pins.analogWritePin(AnalogPin.P15, 0)
}
function ステップ動作(STEP: number) {
    右カウンター = 0
    左カウンター = 0
    while (true) {
        basic.pause(10)
        // 現時刻の情報取得
        R_y = 右カウンター
        // 目標値
        R_r = STEP
        // PID制御の式
        R_e = R_r - R_y
        R_ie = R_ie + (R_e + R_e_pre) * T / 2
        R_U = R_kp * R_e + R_ki * R_ie
        if (R_U >= 1023) {
            R_U = 1023
        } else if (R_U <= 0) {
            R_U = 0
        }
        // 現時刻の情報取得
        L_y = 左カウンター
        // 目標値
        L_r = STEP
        // PID制御の式
        L_e = L_r - L_y
        L_ie = L_ie + (L_e + L_e_pre) * T / 2
        L_U = L_kp * L_e + L_ki * L_ie
        if (L_U >= 1023) {
            L_U = 1023
        } else if (L_U <= 0) {
            L_U = 0
        }
        serial.writeNumbers([左カウンター, L_U])
        if (ステップモード == 1) {
            pins.analogWritePin(AnalogPin.P16, R_U)
            pins.digitalWritePin(DigitalPin.P15, 0)
            pins.analogWritePin(AnalogPin.P2, L_U)
            pins.digitalWritePin(DigitalPin.P13, 0)
        } else {
            if (ステップモード == 2) {
                pins.analogWritePin(AnalogPin.P15, R_U)
                pins.digitalWritePin(DigitalPin.P16, 0)
                pins.analogWritePin(AnalogPin.P13, L_U)
                pins.digitalWritePin(DigitalPin.P2, 0)
            } else {
                if (ステップモード == 3) {
                    pins.analogWritePin(AnalogPin.P16, R_U)
                    pins.digitalWritePin(DigitalPin.P15, 0)
                    pins.analogWritePin(AnalogPin.P13, L_U)
                    pins.digitalWritePin(DigitalPin.P2, 0)
                } else {
                    if (ステップモード == 4) {
                        pins.analogWritePin(AnalogPin.P15, R_U)
                        pins.digitalWritePin(DigitalPin.P16, 0)
                        pins.analogWritePin(AnalogPin.P2, L_U)
                        pins.digitalWritePin(DigitalPin.P13, 0)
                    }
                }
            }
        }
        R_e_pre = R_e
        L_e_pre = L_e
        if (STEP <= L_y && STEP <= R_y) {
            pins.digitalWritePin(DigitalPin.P2, 0)
            pins.digitalWritePin(DigitalPin.P13, 0)
            pins.digitalWritePin(DigitalPin.P15, 0)
            pins.digitalWritePin(DigitalPin.P16, 0)
            basic.pause(200)
            break;
        }
    }
}
function 右回転(STEP: number) {
    右カウンター = 0
    左カウンター = 0
    while (true) {
        basic.pause(10)
        // 現時刻の情報取得
        R_y = 右カウンター
        // 目標値
        R_r = STEP
        // PID制御の式
        R_e = R_r - R_y
        R_ie = R_ie + (R_e + R_e_pre) * T / 2
        R_U = R_kp * R_e + R_ki * R_ie
        if (R_U >= 1023) {
            R_U = 1023
        } else if (R_U <= 0) {
            R_U = 0
        }
        pins.analogWritePin(AnalogPin.P15, R_U)
        pins.digitalWritePin(DigitalPin.P16, 0)
        R_e_pre = R_e
        // 現時刻の情報取得
        L_y = 左カウンター
        // 目標値
        L_r = STEP
        // PID制御の式
        L_e = L_r - L_y
        L_ie = L_ie + (L_e + L_e_pre) * T / 2
        L_U = L_kp * L_e + L_ki * L_ie
        if (L_U >= 1023) {
            L_U = 1023
        } else if (L_U <= 0) {
            L_U = 0
        }
        serial.writeNumbers([左カウンター, L_U])
        pins.analogWritePin(AnalogPin.P2, L_U)
        pins.digitalWritePin(DigitalPin.P14, 0)
        L_e_pre = L_e
        if (STEP <= L_y && STEP <= R_y) {
            pins.digitalWritePin(DigitalPin.P2, 0)
            pins.digitalWritePin(DigitalPin.P13, 0)
            pins.digitalWritePin(DigitalPin.P15, 0)
            pins.digitalWritePin(DigitalPin.P16, 0)
            basic.pause(200)
            break;
        }
    }
}
function ステップ前(数値: number) {
    ステップモード = 1
    ステップ動作(数値)
}

function ステップ右回転(数値: number) {
    ステップモード = 4
    ステップ動作(数値)
}



//music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)

    //% color="#009A00" weight=22 blockId=sonar_ping_2 block="Distance sensor" group="6 Ultrasonic_Distance sensor"
    //% advanced=true
    export function sonar_ping_2(): number {
        let d1 = 0;
        let d2 = 0;

        for (let i = 0; i < 5; i++) {
            // send
            basic.pause(5);
            pins.setPull(DigitalPin.P2, PinPullMode.PullNone);
            pins.digitalWritePin(DigitalPin.P14, 0);
            control.waitMicros(2);
            pins.digitalWritePin(DigitalPin.P14, 1);
            control.waitMicros(10);
            pins.digitalWritePin(DigitalPin.P14, 0);
            // read
            d1 = pins.pulseIn(DigitalPin.P10, PulseValue.High, 500 * 58);
            d2 = d2 + d1;
        }
        return Math.round(Math.idiv(d2 / 5, 58) * 1.5);
    }




    //% color="#009A00" weight=30 block="(minimam 5cm) dstance |%limit| cm  |%nagasa| " group="6 Ultrasonic_Distance sensor"
    //% limit.min=5 limit.max=30 limit.defl=5
    //% advanced=true
    export function sonar_ping_3(limit: number, nagasa: kyori): boolean {
        let d1 = 0;
        let d2 = 0;
        if (limit < 8) {
            limit = 8
        }
        for (let i = 0; i < 5; i++) {
            // send
            basic.pause(5);
            pins.setPull(DigitalPin.P2, PinPullMode.PullNone);
            pins.digitalWritePin(DigitalPin.P1, 0);
            control.waitMicros(2);
            pins.digitalWritePin(DigitalPin.P14, 1);
            control.waitMicros(10);
            pins.digitalWritePin(DigitalPin.P14, 0);
            // read
            d1 = pins.pulseIn(DigitalPin.P10, PulseValue.High, 500 * 58);
            d2 = d1 + d2;
        }
        switch (nagasa) {
            case kyori.short:
                if (Math.idiv(d2 / 5, 58) * 1.5 < limit) {
                    return true;
                } else {
                    return false;
                }
                break;
            case kyori.long:
                if (Math.idiv(d2 / 5, 58) * 1.5 < limit) {
                    return false;
                } else {
                    return true;
                }
                break;
        }
    }


    //% color="#f071bd" weight=30 blockId=auto_photo_R block="right_photoreflector" group="7 photoreflector"
    //% advanced=true
    export function phto_R() {
        return pins.digitalReadPin(DigitalPin.P4);
    }

    //% color="#f071bd" weight=28 blockId=auto_photo_L block="left_photoreflector" group="7 photoreflector"
    //% advanced=true
    export function phto_L() {
        return pins.digitalReadPin(DigitalPin.P3);
    }


    //% color="#6041f1"  weight=33 block="only right |%wb| " group="7 photoreflector"
    //% sence.min=10 sence.max=40
    //% advanced=true
    export function photo_R_out(wb: whiteblack): boolean {

        switch (wb) {
            case whiteblack.black:
                if ((pins.digitalReadPin(DigitalPin.P3) == 1) && (pins.digitalReadPin(DigitalPin.P4) == 0)) {
                    return true;
                } else {
                    return false;
                }
                break;
            case whiteblack.white:
                if ((pins.digitalReadPin(DigitalPin.P3) == 0) && (pins.digitalReadPin(DigitalPin.P4) == 1)) {
                    return true;
                } else {
                    return false;
                }
                break;
        }
    }

    //% color="#6041f1"  weight=34 block="onle left |%wb|" group="7 photoreflector" 
    //% advanced=true
    export function photo_L_out(wb: whiteblack): boolean {


        switch (wb) {
            case whiteblack.black:
                if

                    ((pins.digitalReadPin(DigitalPin.P3) == 0) && (pins.digitalReadPin(DigitalPin.P4) == 1)) {
                    return true;
                } else {
                    return false;
                }
                break;
            case whiteblack.white:
                if ((pins.digitalReadPin(DigitalPin.P3) == 1) && (pins.digitalReadPin(DigitalPin.P4) == 0)) {
                    return true;
                } else {
                    return false;
                }
                break;
        }
    }
    //% color="#6041f1"  weight=35 block="Both |%wb| " group="7 photoreflector"
    //% advanced=true
    export function photo_LR_out(wb: whiteblack): boolean {

        switch (wb) {
            case whiteblack.black:
                if
                    ((pins.digitalReadPin(DigitalPin.P3) == 0) && (pins.digitalReadPin(DigitalPin.P4) == 0)) {
                    return true;
                } else {
                    return false;
                }
                break;

            case whiteblack.white:

                if
                    ((pins.digitalReadPin(DigitalPin.P3) == 1) && (pins.digitalReadPin(DigitalPin.P4) == 1)) {
                    return true;
                } else {
                    return false;
                }
                break;
        }

    }

    /*
        smbus.writeByte(0x81, 0x00)  //0x81=10000001  RGB timing 700ms
        smbus.writeByte(0x81, 0x10)  //16×gain
    
        smbus.writeByte(0x80, 0x03)  //0x03を書くと動作開始
        smbus.writeByte(0x81, 0x2b)  //this.addr 0x29 0x81=10000001 0x2b=00101011
    */
    smbus.writeByte(0x81, 0xF6)  //cycle10


    smbus.writeByte(0x80, 0x03)  //0x03を書くと動作開始










    //% color="#ffa500"  weight=35 block="values light" group="8 color senser"
    //% advanced=true
    export function getLight(): number {

        let result: Buffer = smbus.readBuffer(0xb4, pins.sizeOf(NumberFormat.UInt16LE) * 4)

        return smbus.unpack("HHHH", result)[0]
    }

    //% color="#ffa500"  weight=35 block="values red" group="8 color senser"
    //% advanced=true
    export function getRed(): number {

        return Math.round(rgb()[0] / Math.max(rgb()[0], Math.max(rgb()[1], rgb()[2]))*256)
    }



    //% color="#ffa500"  weight=35 block="values green" group="8 color senser"
    //% advanced=true
    export function getGreen(): number {
        return Math.round(rgb()[1] / Math.max(rgb()[0], Math.max(rgb()[1], rgb()[2])) * 256)
    }




    //% color="#ffa500"  weight=35 block="values blue" group="8 color senser"
    //% advanced=true
    export function getBlue(): number {
        return Math.round(rgb()[2] / Math.max(rgb()[0], Math.max(rgb()[1], rgb()[2])) * 256)
    }






    export function rgb(): number[] {
        let result: number[] = raw()
        let clear: number = result.shift()
        for (let x: number = 0; x < result.length; x++) {
            result[x] = result[x] * 255 / clear
        }
        return result
    }


    export function raw(): number[] {

        let result: Buffer = smbus.readBuffer(0xb4, pins.sizeOf(NumberFormat.UInt16LE) * 4)
        return smbus.unpack("HHHH", result)
    }


    //% color="#ffa500"  weight=16 blockId=color_temp block="color Temperatures value" group="8 color senser"
    //% advanced=true
    export function color_temp(): number {
        return Math.round(3810 * getBlue() / getRed() + 1391)
    }


    //% color="#ffa500" weight=88 blockId=selectcycle
    //% block="choice |%cycle|" group="8 color senser"
    //% advanced=true
    export function selectcycle(cycle: colorcycle): void {

        switch (cycle) {
            case colorcycle.cycle1:
                smbus.writeByte(0x81, 0xFF)
                break;
            case colorcycle.cycle10:
                smbus.writeByte(0x81, 0xF6)
                break;
            case colorcycle.cycle42:
                smbus.writeByte(0x81, 0xD5)
                break;
            case colorcycle.cycle64:
                smbus.writeByte(0x81, 0xC0)
                break;
            case colorcycle.cycle256:
                smbus.writeByte(0x81, 0x00)
                break;
        }
    }

    /*
        //% color="#ffa500" weight=88 blockId=selectgain
        //% block="choice |%gain|" group="8 color senser"
        //% advanced=true
        export function selectgain(gain: colorgain): void {
    
            switch (gain) {
                case colorgain.gain1:
                    smbus.writeByte(0x8C, 0x00)
                    break;
                case colorgain.gain4:
                    smbus.writeByte(0x8C, 0x01)
                    break;
                case colorgain.gain16:
                    smbus.writeByte(0x8C, 0x10)
                    break;
                case colorgain.gain60:
                    smbus.writeByte(0x8C, 0x11)
                    break;
    
            }
        }
    */

    //% color="#ffa500"  weight=16 blockId=color_ID block="color ID" group="8 color senser"
    //% advanced=true
    export function color_ID(): number {
        color_value = 0
        /*     黒:0　　赤：1　緑：2　青：3　茶色：4　白:7  */
        neo_sinamon.showColor(neopixel.colors(NeoPixelColors.Black))


        if ((getLight() > 100) && (getLight() < 400)) {
            if ((color_temp() > 1500) && (color_temp() < 4500)) {
                color_value = 1
                neo_sinamon.showColor(neopixel.colors(NeoPixelColors.Red))
            }

            if ((color_temp() > 4500) && (color_temp() < 5800)) {
                color_value = 2
                neo_sinamon.showColor(neopixel.colors(NeoPixelColors.Green))
            }

            if ((color_temp() > 5800)) {
                color_value = 3
                neo_sinamon.showColor(neopixel.colors(NeoPixelColors.Blue))
            }
        }
        else {
            if (getLight() < 50) {
                color_value = 0
                neo_sinamon.showColor(neopixel.colors(NeoPixelColors.Black))
            }
            if ((getLight() > 50) && (getLight() < 100)) {
                color_value = 4
                neo_sinamon.showColor(neopixel.colors(NeoPixelColors.Orange))
            }
            if (getLight() > 400) {
                color_value = 7
                neo_sinamon.showColor(neopixel.colors(NeoPixelColors.White))
            }



        }
        return color_value
    }




    namespace smbus {
        export function writeByte(register: number, value: number): void {
            let temp = pins.createBuffer(2);
            temp[0] = register;
            temp[1] = value;
            pins.i2cWriteBuffer(0x29, temp, false);
        }


        export function readBuffer(register: number, len: number): Buffer {
            let temp = pins.createBuffer(1);
            temp[0] = register;
            pins.i2cWriteBuffer(0x29, temp, false);
            return pins.i2cReadBuffer(0x29, len, false);
        }


        export function unpack(fmt: string, buf: Buffer): number[] {
            let le: boolean = true;
            let offset: number = 0;
            let result: number[] = [];
            let num_format: NumberFormat = 0;
            for (let c = 0; c < fmt.length; c++) {
                switch (fmt.charAt(c)) {
                    case '<':
                        le = true;
                        continue;
                    case '>':
                        le = false;
                        continue;
                    case 'c':
                    case 'B':
                        num_format = le ? NumberFormat.UInt8LE : NumberFormat.UInt8BE; break;
                    case 'b':
                        num_format = le ? NumberFormat.Int8LE : NumberFormat.Int8BE; break;
                    case 'H':
                        num_format = le ? NumberFormat.UInt16LE : NumberFormat.UInt16BE; break;
                    case 'h':
                        num_format = le ? NumberFormat.Int16LE : NumberFormat.Int16BE; break;
                }
                result.push(buf.getNumber(num_format, offset));
                offset += pins.sizeOf(num_format);
            }
            return result;
        }
    }

    basic.forever(function () {
        if (走行モード == 1) {
            if (左カウンター < 右カウンター) {
                pins.analogWritePin(AnalogPin.P2, 1023)
                pins.analogWritePin(AnalogPin.P16, 450)
            } else {
                pins.analogWritePin(AnalogPin.P2, 450)
                pins.analogWritePin(AnalogPin.P16, 1023)
            }
        }
        if (走行モード == 2) {
            if (左カウンター < 右カウンター) {
                pins.analogWritePin(AnalogPin.P13, 1023)
                pins.analogWritePin(AnalogPin.P15, 450)
            } else {
                pins.analogWritePin(AnalogPin.P13, 450)
                pins.analogWritePin(AnalogPin.P15, 1023)
            }
        }
        serial.writeNumbers([左カウンター, 右カウンター])
    })





}