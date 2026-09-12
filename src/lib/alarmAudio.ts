/**
 * Synthesized Web Audio API Alarm Sound Manager
 * Provides reliable, zero-latency, dependency-free audio alerts that run offline.
 * Gracefully handles browser autoplay policies and audio context suspensions without console errors.
 */
class AlarmSoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private intervalId: number | null = null
  private isAlarmPlaying: boolean = false
  private activeOscillators: OscillatorNode[] = []
  private unlockListenerAttached: boolean = false

  constructor() {
    this.attachUnlockListener()
  }

  private attachUnlockListener() {
    if (typeof window === 'undefined' || this.unlockListenerAttached) return
    this.unlockListenerAttached = true

    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('click', unlock)
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('touchstart', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
    window.addEventListener('click', unlock, { passive: true })
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          this.ctx = new AudioCtx()
        }
      } catch {
        // AudioContext not supported
        return null
      }
    }
    if (this.ctx && !this.masterGain) {
      try {
        this.masterGain = this.ctx.createGain()
        this.masterGain.connect(this.ctx.destination)
      } catch {
        // Gain connection failure
      }
    }
    return this.ctx
  }

  // Dual-tone urgent alert pulse (A5 -> E5)
  private playBeep() {
    if (!this.isAlarmPlaying) return
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    // If context is suspended due to browser autoplay policies, attempt silent resume
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (this.isAlarmPlaying && ctx.state === 'running') {
          this.playBeep()
        }
      }).catch(() => {})
      return
    }

    if (ctx.state !== 'running') return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      // Dual tone: 880 Hz (A5) shifting to 659.25 Hz (E5)
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.setValueAtTime(659.25, now + 0.15)

      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(this.masterGain)

      this.activeOscillators.push(osc)

      osc.onended = () => {
        const idx = this.activeOscillators.indexOf(osc)
        if (idx !== -1) this.activeOscillators.splice(idx, 1)
      }

      osc.start(now)
      osc.stop(now + 0.36)
    } catch {
      // Gracefully ignore audio scheduling issues without console spam
    }
  }

  public startAlert() {
    if (this.isAlarmPlaying) return
    this.stopAlert() // Clear any existing intervals / state

    this.isAlarmPlaying = true
    const ctx = this.getContext()
    if (ctx && this.masterGain) {
      try {
        this.masterGain.gain.setValueAtTime(1, ctx.currentTime)
      } catch {
        // ignore
      }
    }

    // Attempt first beep
    this.playBeep()

    // Repeat alert pulse every 1.5 seconds until silenced
    this.intervalId = window.setInterval(() => {
      if (this.isAlarmPlaying) {
        this.playBeep()
      } else if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    }, 1500)
  }

  public stopAlert() {
    this.isAlarmPlaying = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Immediately silence master gain
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime)
      } catch {
        // ignore
      }
    }

    // Stop and disconnect any currently sounding oscillators
    for (const osc of this.activeOscillators) {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // ignore
      }
    }
    this.activeOscillators = []
  }

  public isPlaying() {
    return this.isAlarmPlaying
  }
}

export const alarmSound = new AlarmSoundManager()
