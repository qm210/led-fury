

## Addressing WLED by UDP

Based on current repository v0.16.0, there are various fields and a lot of different case routings.

* `rgbUdp` is a UDP interface hardcoded to Port 19446
* `notifierUdp`
  * `notifier2Udp` seems to have the same functionality as `notifierUdp`, just a supplementary method.  
* `receiveDirect`
  * whether "realtime UDP" overall is enabled
  * set from the UI, deserialized from element `json.live.en`
* `receiveGroups`
  * bitmask for the groups, i.e. a sum of 2^(groupnr. - 1) 
  * e.g. if you have set the checkmark at group 1 and 3, you get 2^0 + 2^2 = 5   
* `realtimeMode`
* `realtimeOverride`
* `useMainSegmentOnly`
  * set from the UI, deserialized from element `json.live.mso`
* `realtimeTimeout`: Millseconds after last package to change back to normal WLED control. 

# Control Flow in `udp.cpp`
(only what concerns receiving UDP packets, i.e. ignore UDP sending, the E1.31 stuffe tc.)

### Hyperion Protocol
Send an array with [R, G, B, ...] to port 19446.
 * i.e. cannot set single LEDs, always whole array.
This sets `realtimeMode` to `REALTIME_MODE_HYPERION` (equals 3).
Seems to have realtimeTimeout hardcoded to 2500ms, i.e. you need to send the whole array during all that time.

### UDP Realtime Protocols
According to the docs (https://kno.wled.ge/interfaces/udp-realtime/), these are defined by
 * byte 0: which protocol to use
   * 0 = the WLED notifier i.e. to sync UDP between WLED themselves (not what we want)
   * 1 = WARLS
   * 2 = DRGB
   * there are more (DRGBW, DRGBN), don't care for now.
* byte 1: timeout in seconds, docs says that 255 means forever.

Following Bytes are then sequences of LED information:
  * WARLS: sequences of [index, R, G, B]
  * DRGB: sequences of [R, G, B] (complete strip)

This sets `realtimeMode` to `REALTIME_MODE_UDP` (equals 2).
