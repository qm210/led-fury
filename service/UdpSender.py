import asyncio
import socket


UDP_MODE_WARLS = 1
UDP_MODE_DRGB = 2


class UdpSender:

    def __init__(self, host, port):
        self.address = (host, port)
        self.socket = None

    def send(self, values, close=True):
        message_bytes = bytearray(values)
        if self.socket is None:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.sendto(message_bytes, self.address)
        if close:
            self.close()

    def send_drgb(self, values, timeout_sec=1, close=True):
        self.send([UDP_MODE_DRGB, timeout_sec, *values], close=close)

    def close(self):
        if self.socket is not None:
            self.socket.close()
            self.socket = None

    async def _send(self, message: bytearray):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            await asyncio.to_thread(s.sendto, message, self.address)
            s.close()
        except Exception as e:
            print("UdpSender Exception:", str(e))
