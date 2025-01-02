import asyncio
import socket
from datetime import datetime


class UdpSender:

    def __init__(self, host, port):
        self.address = (host, port)

    def send(self, values):
        message_bytes = bytearray(values)
        asyncio.run(self._send(message_bytes))
        # print(datetime.now().isoformat(), "UdpSender sent:", values, "to", self.address)

    async def _send(self, message: bytearray):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            await asyncio.to_thread(s.sendto, message, self.address)
            s.close()
        except Exception as e:
            print("UdpSender Exception:", str(e))
