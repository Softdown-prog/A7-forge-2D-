# ADR 0006 — Recuperação da rota de saída

A auditoria da partida histórica encontrou dois clientes em lados
opostos do mesmo ponto intermediário do corredor. Os dois tinham
uma rota livre até a porta. Como a diferença de distância era menor
que o limiar do atalho, o motor mantinha a rota bloqueada e reiniciava
o intervalo que também controla a recuperação.

Em `customerMotion.ts`, a tentativa de atalho de saída roda quando
o cliente está progredindo. Clientes parados usam o intervalo para
recalcular a rota até o destino ou buscar um desvio lateral. Os
contadores que determinam essas tentativas já fazem parte dos saves.
O movimento e a saída pela soleira continuam sob as verificações do motor.

A regressão carrega o estado do dia 656 e acompanha os dois clientes
até saírem, verificando distância por passo, colisões e caixa.
