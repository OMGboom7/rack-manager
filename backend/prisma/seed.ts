import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const S=0, SW=1, R=2, FW=3, ST=4, UP=5, PP=6;

const D = [
  // ══════ A-01 · Dell/HPE/Lenovo · 核心 ══════
  { n:'Web-01',          b:'Dell',        m:'PowerEdge R760xa',            s:1,  h:2, r:0, t:S,  ip:'10.0.1.101', cb:'Intel', cm:'Xeon 6430', cc:2, mt:'64GB DDR5 4800', ms:16, sto:'[{"model":"1.92TB NVMe U.2","count":4}]', nic:'[{"brand":"Intel","model":"E810 25GbE SFP28","count":2}]' },
  { n:'Web-02',          b:'Dell',        m:'PowerEdge R760xa',            s:3,  h:2, r:0, t:S,  ip:'10.0.1.102', cb:'Intel', cm:'Xeon 6430', cc:2, mt:'64GB DDR5 4800', ms:16, sto:'[{"model":"1.92TB NVMe U.2","count":4}]', nic:'[{"brand":"Intel","model":"E810 25GbE SFP28","count":2}]' },
  { n:'Web-03',          b:'Dell',        m:'PowerEdge R760',              s:5,  h:2, r:0, t:S,  ip:'10.0.1.103', cb:'Intel', cm:'Xeon 5418Y', cc:2, mt:'32GB DDR5 4800', ms:8, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"2.4TB SAS 10K","count":4}]', nic:'[{"brand":"Intel","model":"X710 10GbE SFP+","count":2}]' },
  { n:'Web-04',          b:'Dell',        m:'PowerEdge R750xs',            s:7,  h:2, r:0, t:S,  ip:'10.0.1.104', cb:'Intel', cm:'Xeon 4314', cc:2, mt:'32GB DDR4 3200', ms:4, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"4TB HDD 7.2K","count":4}]', nic:'[{"model":"10GbE SFP+","count":2}]' },
  { n:'App-01',          b:'HPE',         m:'ProLiant DL380 Gen11',        s:9,  h:2, r:0, t:S,  ip:'10.0.1.201', cb:'Intel', cm:'Xeon 5418Y', cc:2, mt:'64GB DDR5 4800', ms:16, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"2.4TB SAS 10K","count":8}]', nic:'[{"model":"25GbE SFP28","count":2}]' },
  { n:'App-02',          b:'HPE',         m:'ProLiant DL380 Gen11',        s:11, h:2, r:0, t:S,  ip:'10.0.1.202', cb:'Intel', cm:'Xeon 5418Y', cc:2, mt:'64GB DDR5 4800', ms:16, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"2.4TB SAS 10K","count":8}]', nic:'[{"model":"25GbE SFP28","count":2}]' },
  { n:'App-03',          b:'HPE',         m:'ProLiant DL360 Gen11',        s:13, h:1, r:0, t:S,  ip:'10.0.1.203', cb:'Intel', cm:'Xeon 5418Y', cc:2, mt:'32GB DDR5 4800', ms:4, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"1.92TB NVMe U.2","count":2}]', nic:'[{"model":"25GbE SFP28","count":2}]' },
  { n:'App-04',          b:'HPE',         m:'ProLiant DL360 Gen10 Plus',   s:14, h:1, r:0, t:S,  ip:'10.0.1.204', cb:'Intel', cm:'Xeon 4314', cc:2, mt:'32GB DDR4 3200', ms:4, sto:'[{"model":"480GB SSD SATA","count":2}]', nic:'[{"model":"10GbE SFP+","count":2}]' },
  { n:'Mid-01',          b:'Lenovo',      m:'ThinkSystem SR665 V3',        s:16, h:2, r:0, t:S,  ip:'10.0.1.205', cb:'AMD', cm:'EPYC 9554', cc:2, mt:'64GB DDR5 4800', ms:12, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"3.84TB NVMe U.2","count":4}]', nic:'[{"model":"25GbE SFP28","count":2}]' },
  { n:'DB-Master',       b:'Dell',        m:'PowerEdge R7625',             s:18, h:2, r:0, t:S,  ip:'10.0.1.10', cb:'AMD', cm:'EPYC 9654', cc:2, mt:'64GB DDR5 5600', ms:24, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"7.68TB NVMe U.2","count":8}]', nic:'[{"model":"100GbE QSFP28","count":2}]' },
  { n:'DB-Slave-1',      b:'Dell',        m:'PowerEdge R7625',             s:20, h:2, r:0, t:S,  ip:'10.0.1.11', cb:'AMD', cm:'EPYC 9654', cc:2, mt:'64GB DDR5 5600', ms:24, sto:'[{"model":"480GB SSD SATA","count":2},{"model":"7.68TB NVMe U.2","count":8}]', nic:'[{"model":"100GbE QSFP28","count":2}]' },
  { n:'DB-Slave-2',      b:'Dell',        m:'PowerEdge R6525',             s:22, h:1, r:0, t:S,  ip:'10.0.1.12', cb:'AMD', cm:'EPYC 7313', cc:2, mt:'32GB DDR4 3200', ms:8, sto:'[{"model":"480GB SSD SATA","count":2}]', nic:'[{"model":"25GbE SFP28","count":2}]' },
  { n:'DB-Slave-3',      b:'HPE',         m:'ProLiant DL580 Gen11',        s:23, h:4, r:0, t:S,  ip:'10.0.1.13', cb:'Intel', cm:'Xeon 8470Q', cc:4, mt:'64GB DDR5 5600', ms:32, sto:'[{"model":"480GB SSD SATA","count":4},{"model":"7.68TB NVMe U.2","count":12}]', nic:'[{"model":"25GbE SFP28","count":4}]' },
  { n:'配线架-01',       b:'Panduit',     m:'DP48688TGY Cat6A 48口',       s:27, h:2, r:0, t:PP },
  { n:'KVM-01',          b:'Raritan',     m:'Dominion KX IV KX4-101',      s:29, h:1, r:0, t:R,  ip:'10.0.1.254' },
  { n:'Storage-Main',    b:'Dell',        m:'PowerStore 1200T',            s:32, h:4, r:0, t:ST, ip:'10.0.1.50' },
  { n:'Core-SW-01',      b:'Cisco',       m:'Nexus 93180YC-FX3',          s:38, h:1, r:0, t:SW, ip:'10.0.0.1' },
  { n:'Core-SW-02',      b:'Cisco',       m:'Nexus 9332D-GX2B',           s:39, h:1, r:0, t:SW, ip:'10.0.0.2' },
  { n:'FW-Perimeter',    b:'Fortinet',    m:'FortiGate 1000F',             s:40, h:1, r:0, t:FW, ip:'10.0.0.253' },

  // ══════ A-02 · Inspur/Sugon/Supermicro · 大数据/AI ══════
  { n:'GPU-H100-01',     b:'NVIDIA',      m:'DGX H100',                    s:1,  h:5, r:1, t:S,  ip:'10.0.2.51' },
  { n:'GPU-A100-01',     b:'NVIDIA',      m:'DGX A100',                    s:6,  h:5, r:1, t:S,  ip:'10.0.2.52' },
  { n:'GPU-L40S-01',     b:'Supermicro',  m:'SYS-420GP-TNAR',             s:11, h:4, r:1, t:S,  ip:'10.0.2.53' },
  { n:'BigData-01',      b:'Inspur',      m:'NF5280M7',                    s:15, h:2, r:1, t:S,  ip:'10.0.2.101' },
  { n:'BigData-02',      b:'Inspur',      m:'NF5270M6',                    s:17, h:2, r:1, t:S,  ip:'10.0.2.102' },
  { n:'BigData-03',      b:'Inspur',      m:'NF5280M6',                    s:19, h:2, r:1, t:S,  ip:'10.0.2.103' },
  { n:'BigData-04',      b:'Sugon',       m:'I620-G40',                    s:21, h:2, r:1, t:S,  ip:'10.0.2.104' },
  { n:'BigData-05',      b:'Sugon',       m:'X785-G30',                    s:23, h:4, r:1, t:S,  ip:'10.0.2.105' },
  { n:'Storage-BU',      b:'NetApp',      m:'AFF A400',                    s:28, h:3, r:1, t:ST, ip:'10.0.2.52' },
  { n:'配线架-02',       b:'Siemon',      m:'MAX-48 Cat6A 48口',            s:31, h:1, r:1, t:PP },
  { n:'Access-SW-01',    b:'H3C',         m:'S6520X-54QC-EI',              s:33, h:1, r:1, t:SW, ip:'10.0.2.1' },
  { n:'Access-SW-02',    b:'H3C',         m:'S5590-28S8XC',                s:34, h:1, r:1, t:SW, ip:'10.0.2.2' },
  { n:'Access-SW-03',    b:'Aruba',       m:'CX 6300M 48G 4SFP56',         s:35, h:1, r:1, t:SW, ip:'10.0.2.3' },
  { n:'FW-BigData',      b:'Hillstone',   m:'SG-6000-X7180',               s:37, h:2, r:1, t:FW, ip:'10.0.2.253' },
  { n:'Router-BU',       b:'Juniper',     m:'MX304',                       s:39, h:3, r:1, t:R,  ip:'10.0.2.254' },

  // ══════ A-03 · Cisco/Juniper/Aruba · 网络核心 ══════
  { n:'Spine-01',        b:'Cisco',       m:'Nexus 9364D-GX2A',            s:1,  h:1, r:2, t:SW, ip:'10.0.0.11' },
  { n:'Spine-02',        b:'Cisco',       m:'Nexus 9364D-GX2A',            s:2,  h:1, r:2, t:SW, ip:'10.0.0.12' },
  { n:'Leaf-01',         b:'Cisco',       m:'Nexus 9348GC-FX3',            s:4,  h:1, r:2, t:SW, ip:'10.0.0.21' },
  { n:'Leaf-02',         b:'Cisco',       m:'Nexus 9348GC-FX3',            s:5,  h:1, r:2, t:SW, ip:'10.0.0.22' },
  { n:'Edge-SW-01',      b:'Juniper',     m:'EX4400-48P',                  s:7,  h:1, r:2, t:SW, ip:'10.0.0.31' },
  { n:'Edge-SW-02',      b:'Juniper',     m:'EX4650-48Y',                  s:8,  h:1, r:2, t:SW, ip:'10.0.0.32' },
  { n:'WLAN-Ctrl-01',    b:'Aruba',       m:'CX 6400 48G',                 s:10, h:1, r:2, t:SW, ip:'10.0.0.41' },
  { n:'WLAN-Ctrl-02',    b:'Aruba',       m:'CX 8360-32Y4C',               s:11, h:1, r:2, t:SW, ip:'10.0.0.42' },
  { n:'Core-Router-01',  b:'Cisco',       m:'ASR 1001-X',                  s:13, h:1, r:2, t:R,  ip:'10.0.0.1' },
  { n:'Core-Router-02',  b:'Cisco',       m:'ISR 4451-X',                  s:14, h:2, r:2, t:R,  ip:'10.0.0.2' },
  { n:'Edge-Router-01',  b:'Juniper',     m:'MX204',                       s:16, h:1, r:2, t:R,  ip:'10.0.0.3' },
  { n:'Edge-Router-02',  b:'Juniper',     m:'SRX4200',                     s:17, h:1, r:2, t:FW, ip:'10.0.0.254' },
  { n:'配线架-03',       b:'CommScope',   m:'MRJ21 Cat6A 48口',             s:20, h:2, r:2, t:PP },
  { n:'MGMT-SW-01',      b:'Cisco',       m:'Catalyst 9300-48P',           s:23, h:1, r:2, t:SW, ip:'10.0.0.99' },
  { n:'MGMT-SW-02',      b:'Cisco',       m:'Catalyst 9200-48P',           s:24, h:1, r:2, t:SW, ip:'10.0.0.100' },

  // ══════ B-01 · Huawei/Fujitsu/Gigabyte · 虚拟化 ══════
  { n:'VM-Host-01',      b:'Huawei',      m:'FusionServer 2288H V7',       s:1,  h:2, r:3, t:S,  ip:'10.0.3.101' },
  { n:'VM-Host-02',      b:'Huawei',      m:'FusionServer 2288H V7',       s:3,  h:2, r:3, t:S,  ip:'10.0.3.102' },
  { n:'VM-Host-03',      b:'Huawei',      m:'FusionServer 1288H V7',       s:5,  h:1, r:3, t:S,  ip:'10.0.3.103' },
  { n:'VM-Host-04',      b:'Huawei',      m:'FusionServer 5288 V7',        s:6,  h:2, r:3, t:S,  ip:'10.0.3.104' },
  { n:'VM-Host-05',      b:'Fujitsu',     m:'PRIMERGY RX2540 M7',          s:8,  h:2, r:3, t:S,  ip:'10.0.3.105' },
  { n:'VM-Host-06',      b:'Fujitsu',     m:'PRIMERGY RX2530 M7',          s:10, h:1, r:3, t:S,  ip:'10.0.3.106' },
  { n:'VM-Host-07',      b:'Fujitsu',     m:'PRIMERGY RX4770 M7',          s:11, h:4, r:3, t:S,  ip:'10.0.3.107' },
  { n:'VM-Host-08',      b:'Gigabyte',    m:'R183-S93-AAV1',               s:15, h:1, r:3, t:S,  ip:'10.0.3.108' },
  { n:'VM-Host-09',      b:'Gigabyte',    m:'R283-S91-AAV1',               s:16, h:2, r:3, t:S,  ip:'10.0.3.109' },
  { n:'VM-Host-10',      b:'Gigabyte',    m:'G493-SB0-AAV2',               s:18, h:4, r:3, t:S,  ip:'10.0.3.110' },
  { n:'VM-Host-11',      b:'ASUS',        m:'RS720A-E12-RS24U',             s:22, h:2, r:3, t:S,  ip:'10.0.3.111' },
  { n:'VM-Host-12',      b:'ASUS',        m:'RS500A-E12-RS12U',             s:24, h:1, r:3, t:S,  ip:'10.0.3.112' },
  { n:'配线架-04',       b:'CommScope',   m:'MRJ21 Cat6A 24口',             s:26, h:1, r:3, t:PP },
  { n:'SAN-SW-01',       b:'Brocade',     m:'G720 64G FC',                 s:28, h:1, r:3, t:SW, ip:'10.0.3.10' },
  { n:'SAN-SW-02',       b:'Brocade',     m:'G730 64G FC',                 s:29, h:1, r:3, t:SW, ip:'10.0.3.11' },
  { n:'Storage-SAN1',    b:'Hitachi',     m:'VSP E590',                     s:31, h:3, r:3, t:ST, ip:'10.0.3.50' },
  { n:'Storage-SAN2',    b:'Huawei',      m:'OceanStor Dorado 5000 V6',    s:34, h:4, r:3, t:ST, ip:'10.0.3.51' },
  { n:'FW-VM',           b:'Huawei',      m:'USG6680E AC',                 s:38, h:2, r:3, t:FW, ip:'10.0.3.253' },

  // ══════ B-02 · Fortinet/PaloAlto/Sangfor · 安全 ══════
  { n:'FW-Edge-01',      b:'Fortinet',    m:'FortiGate 3000F',              s:1,  h:1, r:4, t:FW, ip:'10.0.4.1' },
  { n:'FW-Edge-02',      b:'Fortinet',    m:'FortiGate 600F',               s:2,  h:1, r:4, t:FW, ip:'10.0.4.2' },
  { n:'FW-Internal-01',  b:'Fortinet',    m:'FortiGate 400F',               s:3,  h:1, r:4, t:FW, ip:'10.0.4.3' },
  { n:'FW-Internal-02',  b:'Fortinet',    m:'FortiGate 200F',               s:4,  h:1, r:4, t:FW, ip:'10.0.4.4' },
  { n:'FW-Branch-01',    b:'Fortinet',    m:'FortiGate 100F',               s:5,  h:1, r:4, t:FW, ip:'10.0.4.5' },
  { n:'FW-DMZ-01',       b:'Palo Alto',   m:'PA-5450',                     s:7,  h:1, r:4, t:FW, ip:'10.0.4.10' },
  { n:'FW-DMZ-02',       b:'Palo Alto',   m:'PA-3440',                     s:8,  h:1, r:4, t:FW, ip:'10.0.4.11' },
  { n:'FW-Internet',     b:'Palo Alto',   m:'PA-1410',                     s:9,  h:1, r:4, t:FW, ip:'10.0.4.12' },
  { n:'FW-SSL-VPN',      b:'Sangfor',     m:'AF-2000-FH-LV',               s:11, h:1, r:4, t:FW, ip:'10.0.4.20' },
  { n:'FW-IPS-01',       b:'Sangfor',     m:'AF-1000-FH-LV',               s:12, h:1, r:4, t:FW, ip:'10.0.4.21' },
  { n:'FW-SBC',          b:'Sangfor',     m:'SIP-1000-E600',               s:13, h:1, r:4, t:FW, ip:'10.0.4.22' },
  { n:'SIEM-Collector',  b:'QRadar',      m:'QRadar 1899 M5',              s:15, h:2, r:4, t:S,  ip:'10.0.4.100' },
  { n:'SOC-Analyst',     b:'Dell',        m:'PowerEdge XR4000w',           s:17, h:2, r:4, t:S,  ip:'10.0.4.101' },
  { n:'配线架-05',       b:'Panduit',     m:'DP24688TGY Cat6A 24口',       s:22, h:1, r:4, t:PP },
  { n:'Agg-SW-01',       b:'Aruba',       m:'CX 8325-32C',                 s:24, h:1, r:4, t:SW, ip:'10.0.4.250' },
  { n:'Agg-SW-02',       b:'Aruba',       m:'CX 8325-32C',                 s:25, h:1, r:4, t:SW, ip:'10.0.4.251' },
  { n:'UPS-B-01',        b:'Eaton',       m:'93PS 20kW',                   s:35, h:3, r:4, t:UP },
  { n:'UPS-B-02',        b:'Eaton',       m:'9PX 6000i RT3U',              s:38, h:3, r:4, t:UP },

  // ══════ C-01 · Lenovo/ASUS/Dell · 开发测试 ══════
  { n:'Dev-App-01',      b:'Lenovo',      m:'ThinkSystem SR650 V3',        s:1,  h:2, r:5, t:S,  ip:'10.0.5.101' },
  { n:'Dev-App-02',      b:'Lenovo',      m:'ThinkSystem SR630 V3',        s:3,  h:1, r:5, t:S,  ip:'10.0.5.102' },
  { n:'Dev-App-03',      b:'Lenovo',      m:'ThinkSystem SR655 V3',        s:4,  h:2, r:5, t:S,  ip:'10.0.5.103' },
  { n:'Dev-DB-01',       b:'Lenovo',      m:'ThinkSystem SR860 V3',        s:6,  h:4, r:5, t:S,  ip:'10.0.5.201' },
  { n:'Test-Env-01',     b:'Dell',        m:'PowerEdge R450',              s:10, h:1, r:5, t:S,  ip:'10.0.5.51' },
  { n:'Test-Env-02',     b:'Dell',        m:'PowerEdge R350',              s:11, h:1, r:5, t:S,  ip:'10.0.5.52' },
  { n:'QA-Env-01',       b:'HPE',         m:'ProLiant DL325 Gen11',        s:12, h:1, r:5, t:S,  ip:'10.0.5.53' },
  { n:'QA-Env-02',       b:'HPE',         m:'ProLiant ML350 Gen11',        s:13, h:4, r:5, t:S,  ip:'10.0.5.54' },
  { n:'Edge-Dev',        b:'ASUS',        m:'RS160-E12',                    s:17, h:1, r:5, t:S,  ip:'10.0.5.60' },
  { n:'配线架-06',       b:'Siemon',      m:'MAX-24 Cat6 24口',              s:18, h:1, r:5, t:PP },
  { n:'Dev-SW-01',       b:'H3C',         m:'S5560X-30S-EI',               s:20, h:1, r:5, t:SW, ip:'10.0.5.1' },
  { n:'Dev-SW-02',       b:'H3C',         m:'S5500V3-54PS-SI',             s:21, h:1, r:5, t:SW, ip:'10.0.5.2' },
  { n:'Dev-Router',      b:'H3C',         m:'MSR 3610-X1',                 s:23, h:1, r:5, t:R,  ip:'10.0.5.254' },
  { n:'Dev-FW',          b:'H3C',         m:'SecPath F1000-AI-55',         s:25, h:1, r:5, t:FW, ip:'10.0.5.253' },
  { n:'NAS-Dev',         b:'Synology',    m:'RS4021xs+',                   s:27, h:2, r:5, t:ST, ip:'10.0.5.70' },

  // ══════ C-02 · SuSe/Huawei/Inspur · 容器/K8S ══════
  { n:'K8S-Master-01',   b:'Supermicro',  m:'SYS-620C-TN12R',             s:1,  h:1, r:6, t:S,  ip:'10.0.6.1' },
  { n:'K8S-Master-02',   b:'Supermicro',  m:'SYS-620C-TN12R',             s:2,  h:1, r:6, t:S,  ip:'10.0.6.2' },
  { n:'K8S-Master-03',   b:'Supermicro',  m:'SYS-620C-TN12R',             s:3,  h:1, r:6, t:S,  ip:'10.0.6.3' },
  { n:'K8S-Worker-01',   b:'Supermicro',  m:'SYS-220U-MTNR',              s:5,  h:1, r:6, t:S,  ip:'10.0.6.11' },
  { n:'K8S-Worker-02',   b:'Supermicro',  m:'SYS-220U-MTNR',              s:6,  h:1, r:6, t:S,  ip:'10.0.6.12' },
  { n:'K8S-Worker-03',   b:'Supermicro',  m:'SYS-220U-MTNR',              s:7,  h:1, r:6, t:S,  ip:'10.0.6.13' },
  { n:'K8S-Worker-04',   b:'Inspur',      m:'NF3180M6',                    s:8,  h:1, r:6, t:S,  ip:'10.0.6.14' },
  { n:'K8S-Worker-05',   b:'Inspur',      m:'NF3180M6',                    s:9,  h:1, r:6, t:S,  ip:'10.0.6.15' },
  { n:'K8S-GPU-01',      b:'Inspur',      m:'NF5468M7',                    s:10, h:4, r:6, t:S,  ip:'10.0.6.21' },
  { n:'K8S-GPU-02',      b:'Inspur',      m:'NF5468M7',                    s:14, h:4, r:6, t:S,  ip:'10.0.6.22' },
  { n:'K8S-Storage',     b:'Huawei',      m:'OceanStor Pacific 9520',      s:19, h:5, r:6, t:ST, ip:'10.0.6.50' },
  { n:'配线架-07',       b:'Corning',     m:'EDGE-01U-SP Cat6A 48口',      s:25, h:1, r:6, t:PP },
  { n:'K8S-SW-01',       b:'Huawei',      m:'CloudEngine S5732-H48UM2CC',  s:27, h:1, r:6, t:SW, ip:'10.0.6.250' },
  { n:'K8S-SW-02',       b:'Huawei',      m:'CloudEngine S5732-H24UM2CC',  s:28, h:1, r:6, t:SW, ip:'10.0.6.251' },
  { n:'K8S-LB-01',       b:'F5',          m:'BIG-IP i5800',                 s:30, h:1, r:6, t:R,  ip:'10.0.6.240' },
  { n:'K8S-LB-02',       b:'F5',          m:'BIG-IP R5600',                 s:31, h:1, r:6, t:R,  ip:'10.0.6.241' },
  { n:'UPS-C-01',        b:'Delta',       m:'Ultron DPH 20kW',             s:38, h:2, r:6, t:UP },
  { n:'PDU-C1',          b:'ServerTech',  m:'CWG-24V2-L30M',               s:40, h:1, r:6, t:PP },
  { n:'PDU-C2',          b:'ServerTech',  m:'CWG-24V2-L30M',               s:41, h:1, r:6, t:PP },

  // ══════ D-01 · Dell/IBM/PureStorage/Quantum · 灾备 ══════
  { n:'DR-App-01',       b:'Lenovo',      m:'ThinkSystem SR670 V3',        s:1,  h:3, r:7, t:S,  ip:'10.0.7.101' },
  { n:'DR-App-02',       b:'Lenovo',      m:'ThinkSystem SR635 V3',        s:4,  h:1, r:7, t:S,  ip:'10.0.7.102' },
  { n:'DR-DB-01',        b:'IBM',         m:'Power S1022s',                 s:6,  h:2, r:7, t:S,  ip:'10.0.7.201' },
  { n:'DR-DB-02',        b:'IBM',         m:'Power S1024',                  s:8,  h:2, r:7, t:S,  ip:'10.0.7.202' },
  { n:'DR-Storage-01',   b:'IBM',         m:'FlashSystem 5200',             s:11, h:1, r:7, t:ST, ip:'10.0.7.203' },
  { n:'DR-Storage-02',   b:'PureStorage', m:'FlashArray //X70 R4',          s:13, h:3, r:7, t:ST, ip:'10.0.7.50' },
  { n:'DR-Storage-03',   b:'PureStorage', m:'FlashBlade //S',               s:16, h:4, r:7, t:ST, ip:'10.0.7.51' },
  { n:'DR-Tape',         b:'Quantum',     m:'Scalar i6000',                 s:21, h:8, r:7, t:ST, ip:'10.0.7.52' },
  { n:'DR-SW-01',        b:'Extreme',     m:'5520-48W',                     s:30, h:1, r:7, t:SW, ip:'10.0.7.1' },
  { n:'DR-SW-02',        b:'Extreme',     m:'SLX 9640-24S',                 s:31, h:2, r:7, t:SW, ip:'10.0.7.2' },
  { n:'DR-FW-01',        b:'WatchGuard',  m:'Firebox M690',                s:34, h:1, r:7, t:FW, ip:'10.0.7.253' },
  { n:'DR-FW-02',        b:'WatchGuard',  m:'Firebox M590',                s:35, h:1, r:7, t:FW, ip:'10.0.7.254' },
  { n:'UPS-D1',          b:'Vertiv',      m:'Liebert GXT5-6000IRT5UXL',    s:38, h:2, r:7, t:UP },
  { n:'UPS-D2',          b:'Vertiv',      m:'Liebert EXS 30kVA',           s:40, h:2, r:7, t:UP },

  // ══════ D-02 · TP-Link/ZTE/Sophos · 办公网 ══════
  { n:'OA-FS-01',        b:'Dell',        m:'PowerEdge R6515',              s:1,  h:1, r:8, t:S,  ip:'10.0.8.101' },
  { n:'OA-FS-02',        b:'Dell',        m:'PowerEdge R6515',              s:2,  h:1, r:8, t:S,  ip:'10.0.8.102' },
  { n:'OA-DC-01',        b:'HPE',         m:'ProLiant DL380 Gen10',         s:4,  h:2, r:8, t:S,  ip:'10.0.8.201' },
  { n:'OA-WiFi-Ctrl',    b:'TP-Link',     m:'Omada EAP783',                 s:7,  h:1, r:8, t:R,  ip:'10.0.8.1' },
  { n:'OA-SW-01',        b:'TP-Link',     m:'TL-SG3452XP',                  s:9,  h:1, r:8, t:SW, ip:'10.0.8.2' },
  { n:'OA-SW-02',        b:'TP-Link',     m:'TL-SX3024F',                   s:10, h:1, r:8, t:SW, ip:'10.0.8.3' },
  { n:'OA-SW-03',        b:'TP-Link',     m:'TL-SX3016F',                   s:11, h:1, r:8, t:SW, ip:'10.0.8.4' },
  { n:'OA-Router',       b:'ZTE',         m:'ZXR10 5930-24S',              s:13, h:1, r:8, t:R,  ip:'10.0.8.254' },
  { n:'OA-SW-Core',      b:'ZTE',         m:'ZXR10 5960-4M',               s:14, h:1, r:8, t:SW, ip:'10.0.8.5' },
  { n:'OA-SW-Access',    b:'ZTE',         m:'ZXR10 5260-52TS',             s:15, h:1, r:8, t:SW, ip:'10.0.8.6' },
  { n:'OA-FW-01',        b:'Sophos',      m:'XGS 4300 Rev.2',              s:17, h:1, r:8, t:FW, ip:'10.0.8.253' },
  { n:'OA-FW-02',        b:'Sophos',      m:'XGS 3300 Rev.2',              s:18, h:1, r:8, t:FW, ip:'10.0.8.252' },
  { n:'OA-NAS',          b:'Synology',    m:'FS6400',                      s:20, h:2, r:8, t:ST, ip:'10.0.8.60' },
  { n:'OA-Backup-NAS',   b:'QNAP',        m:'TS-h2490FU',                   s:22, h:3, r:8, t:ST, ip:'10.0.8.61' },
  { n:'PDU-E1',          b:'Geist',       m:'UPDU30IU-24',                 s:40, h:1, r:8, t:PP },
  { n:'PDU-E2',          b:'Geist',       m:'VA4B30M2',                    s:41, h:1, r:8, t:PP },

  // ══════ D-03 · Mellanox/FS.com/MikroTik · 高性能网络 ══════
  { n:'HPC-SW-01',       b:'NVIDIA',      m:'Mellanox SN4600C 64x100G',    s:1,  h:1, r:9, t:SW, ip:'10.0.9.1' },
  { n:'HPC-SW-02',       b:'NVIDIA',      m:'Mellanox SN4600C 64x100G',    s:2,  h:1, r:9, t:SW, ip:'10.0.9.2' },
  { n:'HPC-SW-03',       b:'NVIDIA',      m:'Mellanox SN4410 24x25G+8x100G',s:3, h:1, r:9, t:SW,ip:'10.0.9.3' },
  { n:'OOB-SW-01',       b:'FS.com',      m:'S5860-20SQ 24口 10G',         s:5,  h:1, r:9, t:SW, ip:'10.0.9.10' },
  { n:'OOB-SW-02',       b:'FS.com',      m:'S5860-20SQ 24口 10G',         s:6,  h:1, r:9, t:SW, ip:'10.0.9.11' },
  { n:'OOB-SW-03',       b:'FS.com',      m:'S5860-48SC 48口 25G',         s:7,  h:1, r:9, t:SW, ip:'10.0.9.12' },
  { n:'Edge-RTR-01',     b:'MikroTik',    m:'CCR2216-1G-12XS-2XQ',         s:9,  h:1, r:9, t:R,  ip:'10.0.9.254' },
  { n:'Edge-RTR-02',     b:'MikroTik',    m:'CCR2004-1G-12S+2XS',          s:10, h:1, r:9, t:R,  ip:'10.0.9.253' },
  { n:'Lab-SW-01',       b:'MikroTik',    m:'CRS504-4XQ-IN',               s:12, h:1, r:9, t:SW, ip:'10.0.9.20' },
  { n:'Lab-SW-02',       b:'MikroTik',    m:'CRS518-16XS-2XQ-RM',          s:13, h:1, r:9, t:SW, ip:'10.0.9.21' },
  { n:'配线架-08',       b:'Rosenberger', m:'HDCS 48口 LC OM4',             s:16, h:2, r:9, t:PP },
  { n:'UPS-E1',          b:'Kehua',       m:'KR3000L-J 3kVA',              s:38, h:2, r:9, t:UP },
  { n:'UPS-E2',          b:'Kehua',       m:'KR6000L-J 6kVA',              s:40, h:2, r:9, t:UP },

  // ══════ E-01 · H3C · 服务器/存储 ══════
  { n:'H3C-Svr-01',      b:'H3C',         m:'UniServer R4900 G6',          s:1,  h:2, r:10, t:S,  ip:'10.0.10.101' },
  { n:'H3C-Svr-02',      b:'H3C',         m:'UniServer R4900 G6',          s:3,  h:2, r:10, t:S,  ip:'10.0.10.102' },
  { n:'H3C-Svr-03',      b:'H3C',         m:'UniServer R4700 G6',          s:5,  h:1, r:10, t:S,  ip:'10.0.10.103' },
  { n:'H3C-Svr-04',      b:'H3C',         m:'UniServer R4700 G6',          s:6,  h:1, r:10, t:S,  ip:'10.0.10.104' },
  { n:'H3C-Svr-05',      b:'H3C',         m:'UniServer R6900 G6',          s:8,  h:4, r:10, t:S,  ip:'10.0.10.105' },
  { n:'H3C-Svr-06',      b:'H3C',         m:'UniServer R5500 G6',          s:12, h:2, r:10, t:S,  ip:'10.0.10.106' },
  { n:'H3C-Svr-07',      b:'H3C',         m:'UniServer R2700 G6',          s:14, h:1, r:10, t:S,  ip:'10.0.10.107' },
  { n:'H3C-Storage-01',  b:'H3C',         m:'UniStor CF22000 R2',          s:16, h:5, r:10, t:ST, ip:'10.0.10.50' },
  { n:'H3C-Storage-02',  b:'H3C',         m:'UniStor X10000 G5',           s:21, h:5, r:10, t:ST, ip:'10.0.10.51' },
  { n:'配线架-09',       b:'H3C',         m:'OMXD30000 24口 LC MM',        s:28, h:1, r:10, t:PP },
  { n:'H3C-KVM',         b:'H3C',         m:'UniServer R1500-AK100',       s:29, h:1, r:10, t:R,  ip:'10.0.10.254' },

  // ══════ E-02 · H3C · 网络/安全 ══════
  { n:'H3C-Core-01',     b:'H3C',         m:'S12500G-AF 交换引擎',         s:1,  h:10,r:11, t:SW, ip:'10.0.11.1' },
  { n:'H3C-Spine-01',    b:'H3C',         m:'S9820-8C 400G 数据中心',      s:11, h:2, r:11, t:SW, ip:'10.0.11.11' },
  { n:'H3C-Spine-02',    b:'H3C',         m:'S9820-8C 400G 数据中心',      s:13, h:2, r:11, t:SW, ip:'10.0.11.12' },
  { n:'H3C-Leaf-01',     b:'H3C',         m:'S6850-56HF-H3 100G',          s:15, h:1, r:11, t:SW, ip:'10.0.11.21' },
  { n:'H3C-Leaf-02',     b:'H3C',         m:'S6805-54HF 25G',              s:16, h:1, r:11, t:SW, ip:'10.0.11.22' },
  { n:'H3C-Access-01',   b:'H3C',         m:'S5800-56C-PWR-EI',            s:18, h:1, r:11, t:SW, ip:'10.0.11.31' },
  { n:'H3C-Access-02',   b:'H3C',         m:'S5120V3-52P-LI',              s:19, h:1, r:11, t:SW, ip:'10.0.11.32' },
  { n:'H3C-Access-03',   b:'H3C',         m:'S5048PV5-EI',                 s:20, h:1, r:11, t:SW, ip:'10.0.11.33' },
  { n:'H3C-Router-01',   b:'H3C',         m:'SR8808-X 核心路由器',          s:22, h:5, r:11, t:R,  ip:'10.0.11.254' },
  { n:'H3C-Router-02',   b:'H3C',         m:'MSR 5660 AC',                  s:27, h:2, r:11, t:R,  ip:'10.0.11.253' },
  { n:'H3C-FW-01',       b:'H3C',         m:'SecPath F5000-AI-20',         s:29, h:2, r:11, t:FW, ip:'10.0.11.252' },
  { n:'H3C-FW-02',       b:'H3C',         m:'SecPath M9000-8',              s:31, h:8, r:11, t:FW, ip:'10.0.11.251' },
  { n:'UPS-E-01',        b:'H3C',         m:'UPS2000-A-3KTTS',             s:39, h:2, r:11, t:UP },

  // ══════ E-03 · H3C · 无线/安全网关 ══════
  { n:'H3C-AC-01',       b:'H3C',         m:'WX3500X 无线控制器',           s:1,  h:1, r:12, t:R,  ip:'10.0.12.1' },
  { n:'H3C-AP-SW-01',    b:'H3C',         m:'S5130S-28P-PWR-EI',           s:3,  h:1, r:12, t:SW, ip:'10.0.12.2' },
  { n:'H3C-AP-SW-02',    b:'H3C',         m:'S5130S-52S-PWR-EI',           s:4,  h:1, r:12, t:SW, ip:'10.0.12.3' },
  { n:'H3C-FW-VPN',      b:'H3C',         m:'SecPath F1000-AI-70',         s:6,  h:1, r:12, t:FW, ip:'10.0.12.253' },
  { n:'H3C-FW-Web',      b:'H3C',         m:'SecPath F100-C-G5',           s:7,  h:1, r:12, t:FW, ip:'10.0.12.252' },
  { n:'H3C-IPS',         b:'H3C',         m:'SecPath T5060-G3',            s:9,  h:2, r:12, t:FW, ip:'10.0.12.251' },
  { n:'H3C-WAF',         b:'H3C',         m:'SecPath W2000-G5',            s:11, h:2, r:12, t:FW, ip:'10.0.12.250' },
  { n:'H3C-LB-01',       b:'H3C',         m:'SecPath L5020 负载均衡',       s:13, h:1, r:12, t:R,  ip:'10.0.12.249' },
  { n:'H3C-LB-02',       b:'H3C',         m:'SecPath L5020 负载均衡',       s:14, h:1, r:12, t:R,  ip:'10.0.12.248' },
  { n:'H3C-Manage-01',   b:'H3C',         m:'iMC PLAT 智能管理平台',         s:16, h:1, r:12, t:S,  ip:'10.0.12.200' },
  { n:'配线架-10',       b:'H3C',         m:'OMXD30000 48口 LC SM',         s:18, h:1, r:12, t:PP },
  { n:'UPS-E-02',        b:'H3C',         m:'UPS2000-A-6KTTS',             s:39, h:2, r:12, t:UP },

  // ══════ E-04 · H3C · 超融合/虚拟化 ══════
  { n:'H3C-HCI-01',      b:'H3C',         m:'UIS 6000 G6 超融合一体机',     s:1,  h:2, r:13, t:S,  ip:'10.0.13.101' },
  { n:'H3C-HCI-02',      b:'H3C',         m:'UIS 6000 G6 超融合一体机',     s:3,  h:2, r:13, t:S,  ip:'10.0.13.102' },
  { n:'H3C-HCI-03',      b:'H3C',         m:'UIS 3000 G6 超融合一体机',     s:5,  h:1, r:13, t:S,  ip:'10.0.13.103' },
  { n:'H3C-HCI-04',      b:'H3C',         m:'UIS 3000 G6 超融合一体机',     s:6,  h:1, r:13, t:S,  ip:'10.0.13.104' },
  { n:'H3C-HCI-05',      b:'H3C',         m:'UIS 3000 G6 超融合一体机',     s:7,  h:1, r:13, t:S,  ip:'10.0.13.105' },
  { n:'H3C-HCI-Storage', b:'H3C',         m:'CF8850H 全闪存储',             s:10, h:3, r:13, t:ST, ip:'10.0.13.50' },
  { n:'H3C-Backup',      b:'H3C',         m:'UniStor CB7000G3 备份一体机',  s:14, h:3, r:13, t:ST, ip:'10.0.13.60' },
  { n:'H3C-HCI-SW-01',   b:'H3C',         m:'S9850-4C 400G Spine',          s:18, h:1, r:13, t:SW, ip:'10.0.13.1' },
  { n:'H3C-HCI-SW-02',   b:'H3C',         m:'S9850-4C 400G Spine',          s:19, h:1, r:13, t:SW, ip:'10.0.13.2' },
  { n:'H3C-HCI-SW-03',   b:'H3C',         m:'S9825-32H 200G Leaf',          s:20, h:1, r:13, t:SW, ip:'10.0.13.11' },
  { n:'H3C-HCI-SW-04',   b:'H3C',         m:'S9825-32H 200G Leaf',          s:21, h:1, r:13, t:SW, ip:'10.0.13.12' },
  { n:'H3C-HCI-Router',  b:'H3C',         m:'MSR 3600-28-X1',               s:23, h:1, r:13, t:R,  ip:'10.0.13.254' },
  { n:'UPS-E-03',        b:'H3C',         m:'UPS2000-A-10KTTS',            s:39, h:3, r:13, t:UP },
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.deviceTemplate.deleteMany();
  await prisma.device.deleteMany();
  await prisma.rack.deleteMany();
  await prisma.row.deleteMany();
  await prisma.datacenter.deleteMany();
  await prisma.deviceTemplate.deleteMany();
  await prisma.deviceType.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  await prisma.user.create({
    data: { username:'admin', password:await bcrypt.hash(adminPass, 10), realName:'管理员', role:'ADMIN' },
  });

  const types = await Promise.all([
    prisma.deviceType.create({ data:{ name:'服务器',      color:'#4A90D9' } }),
    prisma.deviceType.create({ data:{ name:'交换机',      color:'#7B68EE' } }),
    prisma.deviceType.create({ data:{ name:'路由器',      color:'#E6A23C' } }),
    prisma.deviceType.create({ data:{ name:'防火墙',      color:'#F56C6C' } }),
    prisma.deviceType.create({ data:{ name:'存储',        color:'#67C23A' } }),
    prisma.deviceType.create({ data:{ name:'UPS',         color:'#909399' } }),
    prisma.deviceType.create({ data:{ name:'配线架/PDU',   color:'#B0C4DE' } }),
  ]);

  const dc = await prisma.datacenter.create({ data:{ name:'主数据中心', location:'上海浦东' } });

  const rowA = await prisma.row.create({ data:{ name:'A排 (核心业务)', datacenterId:dc.id } });
  const rowB = await prisma.row.create({ data:{ name:'B排 (虚拟化/安全)', datacenterId:dc.id } });
  const rowC = await prisma.row.create({ data:{ name:'C排 (开发/K8S)', datacenterId:dc.id } });
  const rowD = await prisma.row.create({ data:{ name:'D排 (灾备/办公)', datacenterId:dc.id } });
  const rowE = await prisma.row.create({ data:{ name:'E排 (H3C专区)', datacenterId:dc.id } });

  const racks = await Promise.all([
    prisma.rack.create({ data:{ name:'A-01', rowId:rowA.id, totalU:42, purpose:'核心业务' } }),
    prisma.rack.create({ data:{ name:'A-02', rowId:rowA.id, totalU:42, purpose:'大数据/AI' } }),
    prisma.rack.create({ data:{ name:'A-03', rowId:rowA.id, totalU:42, purpose:'网络核心' } }),
    prisma.rack.create({ data:{ name:'B-01', rowId:rowB.id, totalU:42, purpose:'虚拟化' } }),
    prisma.rack.create({ data:{ name:'B-02', rowId:rowB.id, totalU:42, purpose:'安全防护' } }),
    prisma.rack.create({ data:{ name:'C-01', rowId:rowC.id, totalU:42, purpose:'开发测试' } }),
    prisma.rack.create({ data:{ name:'C-02', rowId:rowC.id, totalU:42, purpose:'容器/K8S' } }),
    prisma.rack.create({ data:{ name:'D-01', rowId:rowD.id, totalU:42, purpose:'灾备' } }),
    prisma.rack.create({ data:{ name:'D-02', rowId:rowD.id, totalU:42, purpose:'办公网' } }),
    prisma.rack.create({ data:{ name:'D-03', rowId:rowD.id, totalU:42, purpose:'高性能网络' } }),
    prisma.rack.create({ data:{ name:'E-01', rowId:rowE.id, totalU:42, purpose:'H3C 服务器/存储' } }),
    prisma.rack.create({ data:{ name:'E-02', rowId:rowE.id, totalU:42, purpose:'H3C 网络/安全' } }),
    prisma.rack.create({ data:{ name:'E-03', rowId:rowE.id, totalU:42, purpose:'H3C 无线网关' } }),
    prisma.rack.create({ data:{ name:'E-04', rowId:rowE.id, totalU:42, purpose:'H3C 超融合' } }),
  ]);

  for (const d of D) {
    let cpuModelId: number | undefined = undefined;
    let memModelId: number | undefined = undefined;
    if ((d as any).cb && (d as any).cm) {
      const cm = await prisma.cpuModel.findFirst({ where: { brand: (d as any).cb, model: `Xeon ${(d as any).cm}` } })
        || await prisma.cpuModel.findFirst({ where: { brand: (d as any).cb, model: (d as any).cm } });
      cpuModelId = cm?.id;
    }
    if ((d as any).mt) {
      const mm = await prisma.memoryModel.findFirst({ where: { model: (d as any).mt } });
      memModelId = mm?.id;
    }
    await prisma.device.create({
      data: {
        name:d.n, brand:d.b, model:d.m,
        startU:d.s, heightU:d.h,
        rackId:racks[d.r].id, deviceTypeId:types[d.t].id,
        ipAddress:(d as any).ip || undefined, status:'active',
        cpuModelId, cpuCount:(d as any).cc || undefined,
        memModelId, memSize:(d as any).ms || undefined,
        storage:(d as any).sto || undefined,
        nic:(d as any).nic || undefined,
      } as any,
    });
  }

  const brands = [...new Set(D.map(d=>d.b))].sort();
  const models = [...new Set(D.map(d=>d.b+'|'+d.m))];
  console.log(`\nSeed OK — 5排 14机柜 ${D.length}设备`);
  console.log(`品牌: ${brands.length} 个 — ${brands.join(', ')}`);
  console.log(`型号: ${models.length} 个`);
  console.log('Admin login: admin / admin123\n');

  // per-brand model count
  const count:Record<string,number>={};
  D.forEach(d=>{ const k=d.b+'|'+d.m; count[k]=(count[k]||0)+1; });
  const perBrand:Record<string,string[]>={};
  brands.forEach(b=>{ perBrand[b]=[...new Set(D.filter(d=>d.b===b).map(d=>d.m))].sort(); });
  for(const b of brands) console.log(`  ${b}: ${perBrand[b].length}型号 — ${perBrand[b].join(', ')}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
