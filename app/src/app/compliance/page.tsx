'use client'

export default function LegalPage() {
  return (
    <>
      {/* Mentions Légales Section */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mentions Légales</h1>
        <div className="prose max-w-none">
          <p>PixSol_Alyra est une plateforme de NFTs exploitée par PIXSOL.WORLD, une entité commerciale enregistrée dans la Free Zone de Dubaï, UAE. Notre plateforme est régulée par la Dubai Virtual Assets Regulatory Authority (VARA), conformément à la nouvelle législation sur les actifs numériques visant à positionner Dubaï comme un leader mondial dans le secteur des actifs virtuels.</p>
          <p>Adresse légale : FZ Dubaï<br />
          Email de contact : TBD</p>
          <p>Numéro d'enregistrement de la société : TBD</p>
          <p>Numéro license VARA : TBD</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Régulation des actifs numériques</h2>
          <p>En tant qu'acteur régulé sous l'égide de la VARA, nous adhérons aux normes les plus élevées de transparence et de sécurité, garantissant que notre plateforme répond aux exigences réglementaires strictes imposées pour la protection des utilisateurs et la stabilité du marché.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Protection des données personnelles</h2>
          <p>Les adresses de portefeuille des utilisateurs, conservées uniquement pendant leur participation active à nos jeux, sont utilisées pour les tirages au sort de notre loterie. Nous ne conservons aucune autre information personnelle dans un système centralisé.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Sécurité et confidentialité</h2>
          <p>Nous employons des mesures de sécurité rigoureuses pour protéger les données contre les accès non autorisés et garantir la confidentialité des informations de nos utilisateurs.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Droits des utilisateurs</h2>
          <p>Les utilisateurs peuvent accéder à leurs données, demander leur modification ou suppression à tout moment en nous contactant directement.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Modifications des mentions légales</h2>
          <p>Les mentions légales peuvent être mises à jour; les modifications prennent effet immédiatement après leur publication sur notre site.</p>

          <p className="mt-8">Dernière mise à jour : 01/07/2024</p>
        </div>
      </div>

      {/* Politique de Confidentialité Section */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
        <div className="prose max-w-none">
          <p>Dernière mise à jour : 01/07/2024</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">1. Collecte des données</h2>
          <p>Nous collectons les clés publiques des portefeuilles de nos utilisateurs pour permettre les transactions sur notre plateforme. Ces informations sont nécessaires pour la bonne exécution des contrats entre PIXSOL et ses utilisateurs.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">2. Utilisation des données</h2>
          <p>Les clés publiques collectées sont utilisées uniquement pour les besoins des services proposés sur notre plateforme, tel que le transfert de NFTs ou autres actifs virtuels.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">3. Partage des données</h2>
          <p>Les données des utilisateurs ne sont pas vendues, échangées, ni transmises à des tiers sans le consentement de l'utilisateur, sauf pour les besoins de la fourniture des services ou pour répondre à des exigences légales.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">4. Sécurité des données</h2>
          <p>Nous mettons en œuvre des mesures de sécurité pour protéger les données personnelles contre les accès non autorisés, les modifications, les divulgations ou destructions non autorisées.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">5. Droits des utilisateurs</h2>
          <p>Les utilisateurs ont le droit d'accéder à leurs données personnelles, de les rectifier, de les effacer et de s'opposer à leur traitement. Pour exercer ces droits, veuillez nous contacter à pixsol.compliance@world.com.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">6. Modifications de la politique de confidentialité</h2>
          <p>Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les utilisateurs seront informés de tout changement significatif.</p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">7. Contact</h2>
          <p>Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à TBD.</p>
        </div>
      </div>
    </>
 
  )
}