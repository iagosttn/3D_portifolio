# Portfólio 3D Interativo

Este projeto é um portfólio web 3D interativo inspirado no trabalho de Bruno Simon, onde os visitantes podem navegar usando um carro ou um personagem controlado pelo teclado para explorar diferentes seções do portfólio.

## Características

- Ambiente 3D interativo criado com Three.js
- Carro controlável com as teclas WASD ou setas do teclado
- Personagem controlável que pode entrar e sair do carro
- Sistema de interação para alternar entre controlar o carro e o personagem
- Diferentes seções do portfólio representadas como plataformas no mundo 3D
- Informações detalhadas sobre formação, habilidades e projetos em cada seção
- Design responsivo que funciona em dispositivos móveis e desktop
- Barra de carregamento para mostrar o progresso de carregamento dos recursos

## Como Usar

1. Clone ou baixe este repositório
2. Abra o arquivo `index.html` em um servidor web local
   - Você pode usar extensões como Live Server no VS Code
   - Ou iniciar um servidor Python com `python -m http.server`
3. Controles:
   - Use as teclas W, A, S, D ou as setas do teclado para controlar o carro/personagem
   - Pressione E para entrar ou sair do carro
   - Pressione Espaço para fazer o personagem pular
4. Explore o ambiente 3D visitando as diferentes plataformas com informações sobre o portfólio

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript
- Three.js para renderização 3D
- Importação de módulos ES6

## Personalização

Para personalizar este portfólio:

1. Modifique as seções no arquivo `script.js` na função `createPortfolioElements()`
2. Altere as cores, posições e conteúdo de cada seção
3. Adicione seus próprios modelos 3D substituindo o carro simples por um modelo GLTF
4. Personalize o estilo no arquivo `style.css`

## Créditos

Inspirando no trabalho de Bruno Simon (https://bruno-simon.com/)