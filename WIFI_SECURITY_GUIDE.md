# 🛡️ WiFi Security Master Guide

## 🚨 Emergency Response Plan

### **If You Suspect Network Compromise:**
1. **Immediate isolation**: Switch to mobile hotspot
2. **Change all passwords**: WiFi, router admin, email, banking
3. **Scan devices**: Run antivirus on all connected devices
4. **Router factory reset**: Complete reset and reconfiguration

## 🔧 Router Security Hardening

### **Basic Security (Must-Do):**
```
✅ Change default admin credentials (never use admin/admin)
✅ Enable WPA3 encryption (or WPA2 minimum) 
✅ Disable WPS (WiFi Protected Setup)
✅ Hide SSID broadcast (optional but recommended)
✅ Enable firewall with intrusion detection
✅ Disable remote management unless needed
✅ Update firmware regularly (quarterly)
```

### **Advanced Security:**
```
🔒 MAC address filtering for known devices
🔒 Guest network for visitors (isolated from main network)
🔒 VPN server on router (if supported)
🔒 DNS filtering (block malicious domains)
🔒 Bandwidth monitoring and device alerts
🔒 Disable unused services (UPnP, SSH, Telnet)
```

## 🌐 DNS Security Configuration

### **Secure DNS Servers:**
**Primary**: `1.1.1.1` (Cloudflare)
**Secondary**: `8.8.8.8` (Google)

**Privacy-focused alternatives:**
- `9.9.9.9` (Quad9 - blocks malicious domains)
- `208.67.222.222` (OpenDNS)

### **Router DNS Setup:**
1. Access router admin panel (`192.168.1.1` or `192.168.0.1`)
2. Navigate to **Network → DNS Settings**
3. Set custom DNS servers
4. **Save & Reboot**

## 📱 Device-Level Security

### **Essential Steps for All Devices:**
```
🔐 Auto-updates enabled
🔐 VPN client installed (ProtonVPN, Mullvad, ExpressVPN)
🔐 Firewall enabled 
🔐 Antivirus active (Windows Defender minimum)
🔐 HTTPS Everywhere browser extension
🔐 Password manager (Bitwarden, 1Password)
```

### **Browser Security Settings:**
```
🌐 Enable "HTTPS-Only Mode"
🌐 Disable auto-save passwords for critical sites
🌐 Clear cookies/cache monthly
🌐 Use private/incognito for sensitive activities
🌐 Install uBlock Origin ad blocker
```

## 🔍 Network Monitoring Tools

### **Free Router Monitoring:**
- **GlassWire** - Real-time network monitoring
- **Wireshark** - Packet analysis (advanced users)
- **Fing** - Network device scanner
- **Router manufacturer apps** - Many routers have mobile apps

### **Regular Security Checks:**
```bash
# Run our network security test
npm run security:test

# Check open ports on your network
nmap -sn 192.168.1.0/24

# Monitor network traffic 
iftop -i wlan0
```

## 🚨 Warning Signs of Compromise

### **Network-Level Indicators:**
- Slow internet speeds (bandwidth theft)
- Unknown devices in router admin panel
- SSL certificate errors on trusted sites
- Redirects to suspicious pages
- Pop-ups or ads on secure sites

### **Device-Level Indicators:**
- Unexpected browser homepage changes
- New browser toolbars or extensions
- High data usage without explanation
- Slow device performance
- Battery draining faster than normal

## 📞 Emergency Contacts

### **If Compromised:**
1. **ISP Support**: Report potential security breach
2. **Router Manufacturer**: Get latest firmware
3. **Cybersecurity Hotline**: National cyber security centers
4. **Local IT Support**: Professional network security assessment

## 🎯 Monthly Security Checklist

```
□ Update router firmware
□ Change WiFi password (quarterly)
□ Check connected devices list
□ Run network security test
□ Update all device software
□ Review DNS settings
□ Check for firmware updates on all IoT devices
□ Review access logs if available
□ Test backup internet connection (mobile hotspot)
```

## 🔗 Useful Resources

- **Router Security Guide**: https://www.cisa.gov/secure-our-world
- **DNS Security**: https://developers.cloudflare.com/1.1.1.1/
- **WiFi Security Standards**: https://www.wi-fi.org/security
- **VPN Comparison**: https://www.privacyguides.org/vpn/

---

**Remember**: Security is a process, not a one-time setup. Regular monitoring and updates are essential for maintaining a secure network environment. 