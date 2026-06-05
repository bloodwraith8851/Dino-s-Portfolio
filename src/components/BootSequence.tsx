import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BOOT_LOGS = [
  'Loading Linux 6.5.0-1014-aws x86_64...',
  'Loading initial ramdisk...',
  '[    0.000000] Linux version 6.5.0 (rakesh@dev-rig) (gcc 11.4.0)',
  '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz root=UUID=...',
  '[    0.000000] BIOS-provided physical RAM map:',
  '[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',
  '[    0.000000] NX (Execute Disable) protection: active',
  '[    0.000000] SMBIOS 2.8 present.',
  '[    0.012341] Secure boot disabled',
  '[    0.045612] tsc: Fast TSC calibration using PIT',
  '[    0.089123] clocksource: tsc-early: mask: 0xffffffffffffffff max_cycles: 0x2e35eb018cf',
  '[    0.112456] PCI: Using configuration type 1 for base access',
  '[    0.154231] ACPI: Core revision 20230621',
  '[    0.201452] APIC: Streamlined APIC setup.',
  '[    0.256124] Initializing cgroup subsys memory',
  '[    0.312567] Freeing SMP alternatives memory: 36K',
  '[    0.415612] smpboot: CPU0: Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz (family: 0x6, model: 0x55, stepping: 0x7)',
  '[    0.485123] Performance Events: Skylake events, 32-deep LBR, full-width counters',
  '[    0.512643] rcu: Hierarchical SRCU implementation.',
  '[    0.601234] pci 0000:00:00.0: [8086:1237] type 00 class 0x060000',
  '[    0.704512] ata1.00: ATA-8: Amazon Elastic Block Store, 2.0, max UDMA/133',
  '[    0.801234] EXT4-fs (nvme0n1p1): mounted filesystem with ordered data mode',
  "[    0.912345] systemd[1]: Inserted module 'autofs4'",
  '[    1.015678] systemd[1]: Starting systemd-udevd...',
  '[    1.124567] systemd[1]: Started Network Service.',
  '[    1.234512] Initializing RAKESH_DEV_PORTFOLIO_DAEMON...',
  '[    1.345612] Loading edge compute modules [ OK ]',
  '[    1.456712] Establishing secure connection to neon.tech [ OK ]',
  '[    1.567812] Bootstrapping Upstash Redis cache [ OK ]',
  '[    1.678912] Starting Inngest background workers [ OK ]',
  '[    1.801234] System boot complete. Handing over to user-space...',
];

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let currentLine = 0;
    let timeoutId: NodeJS.Timeout;

    const showNextLine = () => {
      if (currentLine >= BOOT_LOGS.length) {
        setIsFading(true);
        timeoutId = setTimeout(onComplete, 800);
        return;
      }

      setLines((prev) => [...prev, BOOT_LOGS[currentLine] || '']);
      currentLine++;

      let delay = Math.random() * 110 + 10;
      if (currentLine === 2) delay = 400;
      if (currentLine === 25) delay = 600;
      if (currentLine === BOOT_LOGS.length - 1) delay = 800;

      timeoutId = setTimeout(showNextLine, delay);
    };

    timeoutId = setTimeout(showNextLine, 300);
    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFading) {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFading, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isFading ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-[#0C0C0C] z-[9999] flex flex-col font-mono text-[13px] md:text-[14px] text-[#D7E2EA] p-4 md:p-8 overflow-hidden"
    >
      <div className="flex-1 flex flex-col justify-end pointer-events-none">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="mb-1"
          >
            {line && line.includes('[ OK ]') ? (
              <span>
                {line.replace('[ OK ]', '')}
                {'[ '}
                <span className="text-[#00ff88]">OK</span>
                {' ]'}
              </span>
            ) : (
              <span>{line}</span>
            )}
          </motion.div>
        ))}
        {lines.length > 0 && lines.length < BOOT_LOGS.length && (
          <div className="h-5 w-2.5 bg-[#D7E2EA] mt-1 animate-pulse" />
        )}
      </div>

      {!isFading && (
        <button
          onClick={onComplete}
          className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-neutral-500 hover:text-white px-4 py-2 border border-neutral-800 hover:border-neutral-600 rounded transition-colors"
        >
          Skip Boot [ESC]
        </button>
      )}
    </motion.div>
  );
}
