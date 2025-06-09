import { Buffer } from 'buffer'
import { configure } from 'pcap-generator'

const generator = configure({ Buffer: Buffer })
const ipPackets = [{
  timestamp: 1802869.484431046, // microseconds
  buffer: Buffer.from('0x27A3A77AEe1ff47717593e2D033b9D4c445815bb', 'hex')
}]
const pcapFile = generator(ipPackets)

console.log('This here is your pcap file in hex:', pcapFile.toString('hex'))
