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
let R_power = 0
let L_power = 0
R_kp = 20
R_ki = 15
L_kp = 20
L_ki = 15


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
    //% block="Move |%sinkou_houkou|,step|%step|" group="1 Basic movement"
    //% step.min=0 step.max=50 Power.defl=0
    export function car_stepmove(sinkou_houkou: direction, step: number): void {
        switch (sinkou_houkou) {
            case direction.forward:
                ステップ前(step)
                break;
            case direction.right_rotation:
                ステップ右回転(step)
                break;
            case direction.left_rotation:
                ステップ左回転(step)
                break;
            case direction.backward:
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
pins.onPulsed(DigitalPin.P6, PulseValue.Low, function () {
    右カウンター += 1
})
function ステップ後ろ(数値: number) {
    ステップモード = 2
    ステップ動作(数値)
}
function ステップ左回転(数値: number) {
    ステップモード = 3
    ステップ動作(数値)
}
pins.onPulsed(DigitalPin.P7, PulseValue.High, function () {
    左カウンター += 1
})
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
pins.onPulsed(DigitalPin.P7, PulseValue.Low, function () {
    左カウンター += 1
})
function ステップ右回転(数値: number) {
    ステップモード = 4
    ステップ動作(数値)
}
pins.onPulsed(DigitalPin.P6, PulseValue.High, function () {
    右カウンター += 1
})

// 制御周期分だけ待つ処理（ｍｓ）
T = 0.01
pins.setPull(DigitalPin.P6, PinPullMode.PullNone)
pins.setPull(DigitalPin.P7, PinPullMode.PullNone)
led.enable(false)
pins.setEvents(DigitalPin.P6, PinEventType.Pulse)
pins.setEvents(DigitalPin.P7, PinEventType.Pulse)

//music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
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