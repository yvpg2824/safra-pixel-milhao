// Prévia de valores, sem transações e sem reservas reais.
export function reservationPreview(totalPi) {
 if (!Number.isFinite(totalPi) || totalPi <= 0) throw new Error('Preço inválido');
 const upfrontPi = totalPi * 0.40;
 const feePi = upfrontPi * 0.20;
 const creditPi = upfrontPi - feePi;
 return {durationDays:7, upfrontPi, feePi, creditPi, remainingPi:totalPi-creditPi, previewOnly:true};
}
