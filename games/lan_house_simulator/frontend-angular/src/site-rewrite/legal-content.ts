/** Full independent Angular-native legal content for review before cutover.
 * No dynamic HTML, no legacy script, no hidden imported generators.
 * Verify all claims and operator identity before publishing.
 */
export interface LegalLink { readonly href:string; readonly label:string }
export interface LegalSection {
 readonly id:string;
 readonly title:string;
 readonly paragraphs:readonly string[];
 readonly links?:readonly LegalLink[];
}
export const termsSections:readonly LegalSection[]=[
  {
    "id": "projeto",
    "title": "O projeto e estes termos",
    "paragraphs": [
      "Lan House Simulator é um jogo independente da Softdown. Estes termos descrevem as condições de uso do site e do jogo. A identificação completa do responsável deverá ser verificada antes da publicação desta nova versão."
    ],
    "links": [
      {
        "href": "/privacidade/",
        "label": "Política de privacidade"
      }
    ]
  },
  {
    "id": "acesso",
    "title": "Acesso e funcionamento",
    "paragraphs": [
      "O jogo funciona no navegador com JavaScript e Canvas 2D. Jogar é gratuito e não exige login. A conta é opcional e permite gerenciar saves na nuvem quando esse serviço estiver disponível e validado.",
      "Não há assinatura obrigatória nem conversão dos valores fictícios do simulador em dinheiro real. Na implementação atualmente publicada, a sessão da conta dura até oito horas nesta aba e termina ao sair ou fechar a aba; esse comportamento deverá ser revalidado na migração."
    ],
    "links": [
      {
        "href": "/conta/",
        "label": "Minha conta"
      }
    ]
  },
  {
    "id": "donate",
    "title": "Donate e Cookies",
    "paragraphs": [
      "O apoio ao desenvolvimento é opcional. Quando os pagamentos estiverem disponíveis, R$ 5 correspondem a 50 Cookies e R$ 10 a 100 Cookies, ao valor de R$ 0,10 por Cookie. São contribuições únicas, sem assinatura.",
      "Para receber Cookies, o jogador precisa de uma conta confirmada e autenticada. O crédito só ocorre após confirmação do pagamento pelo serviço responsável; uma página de retorno não comprova aprovação. Pagamentos pendentes ou recusados não liberam créditos.",
      "Cookies podem ser trocados por cosméticos opcionais no jogo. Cada resgate exige confirmação, fica vinculado à conta e não altera a progressão gratuita nem o dinheiro fictício. Cookies não podem ser sacados, convertidos em dinheiro ou transferidos entre contas.",
      "Pagamentos são processados externamente. Contribuições não implicam automaticamente isenção tributária ou dedução fiscal. Menores precisam de autorização de responsável. Cancelamentos, reembolsos e contestações podem ajustar os créditos, preservados os direitos legais."
    ],
    "links": [
      {
        "href": "/donate/",
        "label": "Informações sobre Donate"
      }
    ]
  },
  {
    "id": "simulacao",
    "title": "Uma simulação em evolução",
    "paragraphs": [
      "Preços, receitas, gastos, anos e equipamentos integram uma experiência de jogo. Nada disso constitui previsão de lucro ou orientação financeira, contábil ou profissional. Mecânicas, aparência e equilíbrio podem mudar durante o desenvolvimento."
    ]
  },
  {
    "id": "progresso",
    "title": "Partidas e arquivos",
    "paragraphs": [
      "O progresso é armazenado localmente. Limpar os dados do navegador ou trocar de endereço pode tornar uma partida inacessível. Exporte um arquivo JSON para guardar sua cópia. Enviar um save à conta opcional não significa backup automático.",
      "A importação de um arquivo substitui a partida conforme a confirmação exibida no jogo. Compartilhe somente arquivos que tem autorização para fornecer, sem dados pessoais de terceiros."
    ],
    "links": [
      {
        "href": "/dados/",
        "label": "Dados locais"
      }
    ]
  },
  {
    "id": "uso",
    "title": "Uso responsável",
    "paragraphs": [
      "Não utilize o site para distribuir código malicioso, atacar sua infraestrutura, coletar dados de terceiros indevidamente ou praticar atos ilícitos. Relatos de problemas não devem expor dados pessoais.",
      "Crianças e adolescentes devem utilizar os recursos de conta com acompanhamento de responsáveis. O projeto não dispõe de chat público nem publicidade personalizada."
    ]
  },
  {
    "id": "autoria",
    "title": "Autoria e referências",
    "paragraphs": [
      "O acesso ao jogo não transfere a titularidade de código, arte, áudio ou marcas. Reutilizações dependem das licenças e permissões aplicáveis.",
      "Referências a marcas e jogos de terceiros pertencem aos seus respectivos titulares e não implicam patrocínio ou afiliação. Capturas da sua partida podem ser compartilhadas licitamente, respeitados os direitos de terceiros."
    ]
  },
  {
    "id": "links",
    "title": "Links externos",
    "paragraphs": [
      "O site pode apresentar links para serviços externos sujeitos a termos e políticas próprios. Abrir esses links é uma decisão do visitante, sem inscrição automática."
    ]
  },
  {
    "id": "direitos",
    "title": "Disponibilidade e direitos",
    "paragraphs": [
      "Manutenção e atualizações podem interromper o acesso. Alterações relevantes serão comunicadas pela versão atualizada dos termos antes da ativação de novas funcionalidades pagas ou finalidades de tratamento de dados.",
      "Estes termos não afastam direitos assegurados pela legislação brasileira, inclusive o Código de Defesa do Consumidor quando aplicável, nem impõem renúncia a reparação legal ou arbitragem obrigatória."
    ]
  },
  {
    "id": "contato",
    "title": "Dúvidas sobre os termos",
    "paragraphs": [
      "O canal de contato deve ser confirmado antes da substituição do site atual. As leis brasileiras são aplicáveis, preservadas as regras legais de competência."
    ],
    "links": [
      {
        "href": "/contato/",
        "label": "Página de contato"
      }
    ]
  }
];

export const privacySections:readonly LegalSection[]=[
  {
    "id": "responsavel",
    "title": "Responsável e contato",
    "paragraphs": [
      "O LHS — Lan House Simulator é um projeto da Softdown. Solicitações sobre privacidade e proteção de dados podem ser encaminhadas pelos canais informados na página de contato."
    ],
    "links": [
      {
        "href": "/contato/",
        "label": "Contato"
      }
    ]
  },
  {
    "id": "dados",
    "title": "Quais informações são tratadas",
    "paragraphs": [
      "Para jogar, o navegador pode guardar o progresso da partida e preferências do jogo. O uso de conta é opcional e pode envolver endereço de email, informações de autenticação e arquivos de partidas enviados voluntariamente.",
      "Podem ser processados dados técnicos de acesso, como IP, navegador e dispositivo, para disponibilizar o serviço, prevenir abusos e proteger sua segurança. Dados enviados voluntariamente ao suporte são utilizados para responder ao atendimento."
    ]
  },
  {
    "id": "finalidades",
    "title": "Finalidades do tratamento",
    "paragraphs": [
      "Os dados são utilizados para funcionamento do jogo, armazenamento de preferências e partidas, recursos opcionais de conta, recuperação de acesso quando solicitada, suporte e proteção da integridade do serviço.",
      "Os tratamentos devem observar as finalidades comunicadas nesta política e as bases legais pertinentes."
    ]
  },
  {
    "id": "partida",
    "title": "Partidas e preferências locais",
    "paragraphs": [
      "A partida e a preferência de som permanecem no navegador utilizado. É possível jogar sem criar conta, exportar ou importar a partida e gerenciar os dados locais.",
      "O progresso local não é enviado automaticamente para a conta online. Limpar os dados do navegador pode apagar a partida; os arquivos baixados permanecem sob seu controle."
    ],
    "links": [
      {
        "href": "/dados/",
        "label": "Dados locais"
      }
    ]
  },
  {
    "id": "conta",
    "title": "Conta opcional e saves online",
    "paragraphs": [
      "A conta opcional requer informações de cadastro e acesso. O email pode ser utilizado para confirmação, recuperação de acesso e comunicações ligadas ao serviço.",
      "Na implementação publicada anteriormente, a sessão de acesso é mantida temporariamente na aba por até oito horas e encerrada ao sair ou fechar a aba. A senha não é armazenada pelo site; a nova integração precisa repetir e comprovar essas garantias antes de ser ativada.",
      "O envio de partidas online depende de ação do jogador. O serviço pode manter a partida principal e uma cópia da versão anterior para recuperação, conforme suas condições. Apagar a partida local não apaga a conta nem arquivos enviados online."
    ],
    "links": [
      {
        "href": "/conta/",
        "label": "Minha conta"
      }
    ]
  },
  {
    "id": "pagamentos",
    "title": "Apoios e créditos",
    "paragraphs": [
      "Quando Donate estiver disponível, podem ser tratados identificador da conta, valor, situação do pagamento e registros de crédito ou ajuste de Cookies, para vincular a contribuição, evitar duplicidades, prestar suporte e cumprir obrigações legais.",
      "O pagamento ocorre em página externa do prestador. O site não solicita nem guarda o número completo de cartão ou seu código de segurança. Registros necessários à comprovação das transações podem ser conservados pelos prazos legais."
    ],
    "links": [
      {
        "href": "/donate/",
        "label": "Donate"
      }
    ]
  },
  {
    "id": "compartilhamento",
    "title": "Prestadores e transferências",
    "paragraphs": [
      "Dados podem ser tratados por prestadores essenciais para autenticação, hospedagem, armazenamento, pagamentos, segurança e suporte, para finalidades operacionais e obrigações legais.",
      "Serviços utilizados podem envolver processamento em outros países, sujeito às normas aplicáveis para transferências internacionais. Dados pessoais e partidas de jogadores não são comercializados nem utilizados para publicidade personalizada."
    ]
  },
  {
    "id": "seguranca",
    "title": "Segurança e conservação",
    "paragraphs": [
      "São adotadas medidas proporcionais à natureza dos dados, com restrição de acesso quando cabível. Nenhum serviço online é inteiramente livre de riscos; utilize senhas exclusivas e proteja seus backups.",
      "Dados locais permanecem no navegador até substituição, exclusão ou limpeza. Dados da conta e partidas online devem ser conservados somente pelo período necessário, ressalvadas obrigações legais. Registros técnicos seguem prazos compatíveis com segurança e operação."
    ]
  },
  {
    "id": "direitos",
    "title": "Seus direitos e escolhas",
    "paragraphs": [
      "É possível jogar sem conta e controlar a partida local. Nos termos da legislação, o titular pode solicitar informações, confirmação de tratamento, acesso, correção, portabilidade, exclusão e outros direitos aplicáveis.",
      "Pedidos sobre conta e arquivos online devem ser enviados pelos canais de contato. Pode ser necessário confirmar a titularidade para proteger os dados, sem solicitar sua senha."
    ],
    "links": [
      {
        "href": "/contato/",
        "label": "Contato e privacidade"
      }
    ]
  },
  {
    "id": "menores",
    "title": "Crianças e adolescentes",
    "paragraphs": [
      "Pais e responsáveis devem acompanhar o uso de contas e o compartilhamento de arquivos por crianças e adolescentes. Não inclua dados pessoais de terceiros nos arquivos exportados ou mensagens de suporte."
    ]
  },
  {
    "id": "atualizacoes",
    "title": "Atualizações desta política",
    "paragraphs": [
      "Esta política pode mudar conforme evoluam o jogo e suas finalidades de tratamento de dados. A versão vigente estará nesta página após publicação. A proteção de dados pessoais observa a Lei Geral de Proteção de Dados Pessoais (LGPD)."
    ],
    "links": [
      {
        "href": "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
        "label": "Consultar a LGPD"
      }
    ]
  }
];
